#!/usr/bin/env python3
"""One-time controlled cleanup of 14 verified unused JPEGs in Chetesaí Storage.

Uses the official Storage API. Never DELETE directly from storage.objects.
This file intentionally has a fixed allowlist and never accepts external paths.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import urllib.parse
import urllib.request

PROJECT_REF = "wbtylhjdhxnddzvekkyw"
BUCKET = "exercise-media"
API_ROOT = f"https://{PROJECT_REF}.supabase.co/storage/v1/object"
ENCRYPTED_ARCHIVE = "chetesai-jpeg-batch09-rollback.tar.gz.enc"

# Each replacement must still be stored AND referenced by a current exercise.
PAIRS = [
    ("bear-crawl/imagen-1787168381512-4e11d941.jpg", ""),
    ("dead-bug-de-activacion/imagen-1787397115140-9aa029c8.jpg", ""),
    ("dead-bug-de-activacion/imagen-1787397682182-ab2bb7eb.jpg", ""),
    ("estiramiento-de-pectoral-en-pared/imagen-1787412973042-136fe23d.jpg", ""),
    ("estiramiento-de-pectoral-en-pared/imagen-1787690511098-5a79e58b.jpg", ""),
    ("jalon-agarre-neutro/imagen-1787409740535-32a65a11.jpg", ""),
    ("jalon-al-pecho/imagen-1787409983012-363cfc98.jpg", ""),
    ("jumping-jack-suave/imagen-1788190814496-792b3ee3.jpg", ""),
    ("jumping-jacks/imagen-1788191439021-e5ce6c23.jpg", ""),
    ("kettlebell-swing/imagen-1787342040377-9766acc5.jpg", ""),
    ("press-de-pecho-con-mancuernas/imagen-1787083166684.jpeg", ""),
    ("press-de-pecho-con-mancuernas/imagen-1787587618191-d9a5c952.jpg", ""),
    ("puente-de-gluteos-de-activacion/imagen-1788712322916-27ae0c60.jpg", ""),
    ("remo-en-maquina/imagen-1788722799718-58553108.jpg", ""),
]

def assert_manifest():
    assert len(PAIRS) == 14 and len({a for a, _ in PAIRS}) == len(PAIRS)
    for original, unused in PAIRS:
        assert unused == "", "No published WebP is expected for an orphan"
        assert original.lower().endswith((".jpg", ".jpeg"))
        assert not original.startswith("zancada-atras-con-press-encima"), "New exercise media is protected"
        assert not original.startswith("/") and ".." not in original
        assert "\n" not in original and "'" not in original
    assert os.getenv("SUPABASE_DB_URL"), "Database credential missing"

def psql(sql):
    # Postgres 17 client is run inside a transient container, with no DB URL in arguments.
    cmd = ["docker", "run", "--rm", "-i", "-e", "SUPABASE_DB_URL",
           "postgres:17", "sh", "-ec",
           'psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1']
    result = subprocess.run(cmd, input=sql, text=True, capture_output=True, check=False)
    if result.returncode:
        raise RuntimeError("Database safety check failed: " + result.stderr[-2400:])
    return result.stdout

def validate(before=True):
    assert_manifest()
    rows = ",\n".join("('%s','%s')" % (a, b) for a, b in PAIRS)
    checks = [
        "DO $safe$",
        "DECLARE item record; tab record; referenced boolean;",
        "BEGIN",
        "  IF (SELECT count(*) FROM storage.objects WHERE bucket_id='exercise-media' AND lower(right(name,5))='.webp') < 332 THEN",
        "    RAISE EXCEPTION 'WebP catalogue dropped below baseline'; END IF;",
        "  IF (SELECT count(*) FROM storage.objects WHERE bucket_id='exercise-media' AND lower(right(name,4))='.png') < 80 THEN",
        "    RAISE EXCEPTION 'PNG catalogue dropped below baseline'; END IF;",
        "  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='exercise-media' AND name='zancada-atras-con-press-encima-hombre/imagen-1795090727025-88122d8b.png') THEN",
        "    RAISE EXCEPTION 'Protected male zancada image missing'; END IF;",
        "  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='exercise-media' AND name='zancada-atras-con-press-encima-mujer/imagen-1795091043795-747211e5.png') THEN",
        "    RAISE EXCEPTION 'Protected female zancada image missing'; END IF;",
        " FOR item IN SELECT * FROM (VALUES " + rows + ") AS pairs(original_path,unused) LOOP",
    ]
    if before:
        checks += [
            "  IF NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=item.original_path AND o.created_at < '2026-11-01' AND o.updated_at < '2026-11-15') THEN",
            "    RAISE EXCEPTION 'Expected archived JPEG missing or newly modified: %',item.original_path; END IF;",
        ]
    else:
        checks += [
            "  IF EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=item.original_path) THEN",
            "    RAISE EXCEPTION 'JPEG still present: %',item.original_path; END IF;",
        ]
    if before:
        checks += [
            "  FOR tab IN SELECT table_name FROM information_schema.tables",
            "    WHERE table_schema='public' AND table_type='BASE TABLE' LOOP",
            "    EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I t WHERE strpos(row_to_json(t)::text,$1)>0)',tab.table_name)",
            "      INTO referenced USING item.original_path;",
            "    IF referenced THEN RAISE EXCEPTION 'JPEG referenced in table %: %',tab.table_name,item.original_path; END IF;",
            "  END LOOP;",
        ]
    checks += [" END LOOP;", "END $safe$;"]
    psql("\n".join(checks))
    print(("Orphan audit OK" if before else "Orphan deletion verification OK") + f": {len(PAIRS)} JPG/JPEG files; active WebP and new PNG images protected.")

def api_request(method, url, body=None):
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
        headers={"Authorization": "Bearer " + key, "apikey": key,
                 **({"Content-Type": "application/json"} if data is not None else {})})
    with urllib.request.urlopen(req, timeout=75) as res:
        return res.read()

def archive():
    validate(before=True)
    assert os.getenv("BACKUP_ENCRYPTION_PASSWORD"), "Encryption password missing"
    assert os.getenv("SUPABASE_SERVICE_ROLE_KEY"), "Service key missing"
    manifest = []
    with tempfile.TemporaryDirectory(prefix="chetesai-jpeg01-") as dirname:
        temp = Path(dirname)
        for original, replacement in PAIRS:
            url = API_ROOT + "/" + BUCKET + "/" + urllib.parse.quote(original, safe="/")
            content = api_request("GET", url)
            if not content or len(content) > 30_000_000:
                raise RuntimeError("Unexpected backup object size: " + original)
            destination = temp / "jpeg" / original
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(content)
            manifest.append({"original": original, "replacement": replacement,
                             "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()})
        (temp / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        tarpath = temp / "archive.tar.gz"
        with tarfile.open(tarpath, "w:gz") as tar:
            tar.add(temp / "manifest.json", arcname="manifest.json")
            tar.add(temp / "jpeg", arcname="jpeg")
        subprocess.run(["openssl", "enc", "-aes-256-cbc", "-salt", "-pbkdf2",
                        "-in", str(tarpath), "-out", ENCRYPTED_ARCHIVE,
                        "-pass", "env:BACKUP_ENCRYPTION_PASSWORD"], check=True)
        # Verify encrypted archive before deletion. No plaintext artifact is uploaded.
        test = subprocess.Popen(
            ["openssl", "enc", "-d", "-aes-256-cbc", "-pbkdf2",
             "-in", ENCRYPTED_ARCHIVE, "-pass", "env:BACKUP_ENCRYPTION_PASSWORD"],
            stdout=subprocess.PIPE)
        check = subprocess.run(["tar", "-tzf", "-"], stdin=test.stdout, capture_output=True)
        if test.stdout:
            test.stdout.close()
        if test.wait() != 0 or check.returncode != 0:
            raise RuntimeError("Encrypted rollback archive failed its integrity check")
    print("Encrypted rollback archive verified; bytes:", sum(x["bytes"] for x in manifest))
    assert Path(ENCRYPTED_ARCHIVE).stat().st_size > 0

def delete():
    validate(before=True)
    assert Path(ENCRYPTED_ARCHIVE).is_file(), "No encrypted rollback archive available"
    if os.getenv("AUTHORIZED_BATCH_ID") != "CHETESAI-20261119-JPEG-09":
        raise RuntimeError("Deletion guard is not enabled")
    # Official Supabase Storage API. Never run SQL DELETE on storage.objects.
    response = api_request("DELETE", API_ROOT + "/" + BUCKET,
        {"prefixes": [a for a, _ in PAIRS]})
    parsed = json.loads(response)
    if not isinstance(parsed, list):
        raise RuntimeError("Unexpected Storage API deletion response; verify via SQL")
    print(f"Storage API removal returned {len(parsed)} records, expected {len(PAIRS)}.")
    if len(parsed) != len(PAIRS):
        raise RuntimeError("Storage API did not confirm all removals")

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("audit", "archive", "remove", "verify"):
        raise SystemExit("Usage: cleanup-jpeg-batch09.py audit|archive|remove|verify")
    operation = sys.argv[1]
    if operation == "audit": validate(before=True)
    elif operation == "archive": archive()
    elif operation == "remove": delete()
    else: validate(before=False)
