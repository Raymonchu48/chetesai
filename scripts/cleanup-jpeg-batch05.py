#!/usr/bin/env python3
"""One-time controlled cleanup of 25 verified orphan JPEGs in Chetesaí Storage.

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
ENCRYPTED_ARCHIVE = "chetesai-jpeg-batch05-rollback.tar.gz.enc"

# Each replacement must still be stored AND referenced by a current exercise.
PAIRS = [
    ("sentadilla-bulgara/imagen-1787675421552-9f7f7e9f.jpg", "sentadilla-bulgara/imagen-1792351477702-dfc0abb9-optimized-q92-5ab040b6.webp"),
    ("curl-concentracion/imagen-1787689206485-ab9eae4b.jpg", "curl-concentracion/imagen-1792320885013-3cf8bb7c-optimized-q92-9b108596.webp"),
    ("sentadilla-goblet/imagen-1787674430393-8bca997c.jpg", "sentadilla-goblet/imagen-1792352166645-5b15840f-optimized-q92-aeb62035.webp"),
    ("extension-unilateral-en-polea/imagen-1788184753028-90067588.jpg", "extension-unilateral-en-polea/imagen-1792326424719-aa4e53b7-optimized-q92-4889237f.webp"),
    ("extension-de-triceps-en-polea/imagen-1788181664988-59058e92.jpg", "extension-de-triceps-en-polea/imagen-1792326354055-daf3988f-optimized-q92-2d6a8d4a.webp"),
    ("curl-en-polea/imagen-1787689730533-54b91d67.jpg", "curl-en-polea/imagen-1792321113204-7f6759cc-optimized-q92-cad525b9.webp"),
    ("pullover-con-mancuerna/imagen-1787588528286-b2c9ef78.jpg", "pullover-con-mancuerna/imagen-1792350840876-67d3f6cc-optimized-q92-2c5214a5.webp"),
    ("elevaciones-laterales/imagen-1787258362545-cb2d5f5a.jpg", "elevaciones-laterales/imagen-1792322784963-4c24cc04-optimized-q92-464adb2a.webp"),
    ("press-militar-con-mancuernas/imagen-1787588414128-1de620b4.jpg", "press-militar-con-mancuernas/imagen-1792350463283-b32476f8-optimized-q92-008d138a.webp"),
    ("press-inclinado-con-mancuernas/imagen-1787588242241-7a0c2bd9.jpg", "press-inclinado-con-mancuernas/imagen-1792350402026-7435c303-optimized-q92-8b3f040a.webp"),
    ("elevacion-de-rodillas-colgado/imagen-1787258085096-2129e186.jpg", "elevacion-de-rodillas-colgado/imagen-1792439018012-0d996bc5-optimized-q92-b7d3cdd0.webp"),
    ("pullover-con-mancuerna/imagen-1787084115879.jpeg", "pullover-con-mancuerna/imagen-1792350840876-67d3f6cc-optimized-q92-2c5214a5.webp"),
    ("sentadilla-frontal/imagen-1787344203144-883b0453.jpg", "sentadilla-frontal/imagen-1792521238910-d55593b5-optimized-q92-0d7179c6.webp"),
    ("press-frances/imagen-1787588146796-6e788887.jpg", "press-frances/imagen-1792349459822-df80fc7b-optimized-q92-b67997fe.webp"),
    ("press-inclinado-con-mancuernas/imagen-1787588069295-c022dc4a.jpg", "press-inclinado-con-mancuernas/imagen-1792350402026-7435c303-optimized-q92-8b3f040a.webp"),
    ("dominadas-pronas/imagen-1787257318672-f7b13cf7.jpg", "dominadas-pronas/imagen-1792438926436-5e8879b5-optimized-q92-02fcfad7.webp"),
    ("curl-inclinado/imagen-1787257159804-b2e4d695.jpg", "curl-inclinado/imagen-1792337561820-d0014f1c-optimized-q92-407861b8.webp"),
    ("ab-wheel-rollout/imagen-1787256956754-57ce246d.jpg", "ab-wheel-rollout/imagen-1792843044538-11a524db-optimized-q92-2e33a1ff.webp"),
    ("plancha-lateral/imagen-1787256513777-e6d592e3.jpg", "plancha-lateral/imagen-1792347197180-c46715e7-optimized-q92-7504394c.webp"),
    ("press-inclinado-con-barra/imagen-1787083568662.jpeg", "press-inclinado-con-barra/imagen-1792520299280-470e57f1-optimized-q92-b9ccdd24.webp"),
    ("sentadilla-con-barra-trasera/imagen-1787343767568-9bf45bd7.jpg", "sentadilla-con-barra-trasera/imagen-1792521098340-461fdbf8-optimized-q92-a555066e.webp"),
    ("aperturas-con-mancuernas/imagen-1787082232407.jpeg", "aperturas-con-mancuernas/imagen-1792336898764-841c186a-optimized-q92-1e9ad30b.webp"),
    ("plancha-frontal/imagen-1787256298827-9de7bbb1.jpg", "plancha-frontal/imagen-1792327448410-a88d72c7-optimized-q92-58862a4a.webp"),
    ("plancha-lateral/imagen-1787256234132-ee05dcc5.jpg", "plancha-lateral/imagen-1792347197180-c46715e7-optimized-q92-7504394c.webp"),
    ("remo-con-barra/imagen-1787343567644-e18d2de2.jpg", "remo-con-barra/imagen-1792521169447-7867a168-optimized-q92-5661d610.webp"),
]

def assert_manifest():
    assert len(PAIRS) == 25 and len({a for a, _ in PAIRS}) == len(PAIRS)
    for original, replacement in PAIRS:
        assert original.lower().endswith((".jpg", ".jpeg"))
        assert replacement.endswith(".webp")
        assert not original.startswith("zancada-atras-con-press-encima"), "New exercise is protected"
        assert original.split("/", 1)[0] == replacement.split("/", 1)[0]
        for value in (original, replacement):
            assert value and not value.startswith("/") and ".." not in value
            assert "\n" not in value and "'" not in value
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
        " FOR item IN SELECT * FROM (VALUES " + rows + ") AS pairs(original_path,replacement_path) LOOP",
    ]
    if before:
        checks += [
            "  IF NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=item.original_path AND o.created_at < '2026-11-01' AND o.updated_at < '2026-11-15') THEN",
            "    RAISE EXCEPTION 'Expected JPEG missing: %',item.original_path; END IF;",
        ]
    else:
        checks += [
            "  IF EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=item.original_path) THEN",
            "    RAISE EXCEPTION 'JPEG still present: %',item.original_path; END IF;",
        ]
    checks += [
        "  IF NOT EXISTS(",
        "    SELECT 1 FROM storage.objects w WHERE w.bucket_id='exercise-media' AND w.name=item.replacement_path",
        "    AND EXISTS(SELECT 1 FROM public.ejercicios e WHERE strpos(row_to_json(e)::text,item.replacement_path)>0)",
        "  ) THEN RAISE EXCEPTION 'WebP missing or not referenced: %',item.replacement_path; END IF;",
    ]
    if before:
        checks += [
            "  FOR tab IN SELECT table_name FROM information_schema.tables",
            "    WHERE table_schema='public' AND table_type='BASE TABLE' LOOP",
            "    EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I t WHERE strpos(row_to_json(t)::text,$1)>0)',tab.table_name)",
            "      INTO referenced USING item.original_path;",
            "    IF referenced THEN RAISE EXCEPTION 'JPEG is referenced in table %: %',tab.table_name,item.original_path; END IF;",
            "  END LOOP;",
        ]
    checks += [" END LOOP;", "END $safe$;"]
    psql("\n".join(checks))
    print(("Pre-deletion audit OK" if before else "Post-deletion verification OK") + f": {len(PAIRS)} JPEGs, active WebP replacements.")

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
    if os.getenv("AUTHORIZED_BATCH_ID") != "CHETESAI-20261119-JPEG-05":
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
        raise SystemExit("Usage: cleanup-jpeg-batch05.py audit|archive|remove|verify")
    operation = sys.argv[1]
    if operation == "audit": validate(before=True)
    elif operation == "archive": archive()
    elif operation == "remove": delete()
    else: validate(before=False)
