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
ENCRYPTED_ARCHIVE = "chetesai-jpeg-batch04-rollback.tar.gz.enc"

# Each replacement must still be stored AND referenced by a current exercise.
PAIRS = [
    ("crunch-abdominal/imagen-1787678233323-b9a3596b.jpg", "crunch-abdominal/imagen-1792268917657-8415ac1e-optimized-q92-e1ea7fce.webp"),
    ("90-90-de-cadera/imagen-1787677719540-5ce7b4d6.jpg", "90-90-de-cadera/imagen-1792268412092-576712eb-optimized-q92-c370f0ae.webp"),
    ("cobra-suave/imagen-1787686562840-56fe12eb.jpg", "cobra-suave/imagen-1792268865385-dc3fd551-optimized-q92-5af73450.webp"),
    ("scapular-push-up/imagen-1788801630557-f582b7f0.jpg", "scapular-push-up/imagen-1792328210635-d74a1362-optimized-q92-eb016fcc.webp"),
    ("pullover-en-polea/imagen-1787589120153-b0cac61f.jpg", "pullover-en-polea/imagen-1792350951547-40be52fc-optimized-q92-28915815.webp"),
    ("sentadilla-al-banco/imagen-1788808022704-a1ff434c.jpg", "sentadilla-al-banco/imagen-1792266697533-0d0fb9c3-optimized-q92-afb2b23c.webp"),
    ("dead-bug/imagen-1787396746279-c16991b2.jpg", "dead-bug/imagen-1792321716155-5f4ffc70-optimized-q92-6157d33a.webp"),
    ("hollow-hold/imagen-1787677365097-14bb1e36.jpg", "hollow-hold/imagen-1792345963599-b91cf17e-optimized-q92-f2416893.webp"),
    ("turkish-get-up/imagen-1787400858220-4ca8081b.jpg", "turkish-get-up/imagen-1792521329037-bbd0d107-optimized-q92-ef6e79c2.webp"),
    ("rotacion-externa-con-banda/imagen-1788727042616-53858f55.jpg", "rotacion-externa-con-banda/imagen-1792266886893-9f32c869-optimized-q92-8e2fdc2d.webp"),
    ("fondos-en-banco/imagen-1788190429276-6b95557f.jpg", "fondos-en-banco/imagen-1792327010186-f1d1b42e-optimized-q92-4c3950ed.webp"),
    ("estiramiento-de-isquiotibiales-tumbado/imagen-1788378783567-d552aabe.jpg", "estiramiento-de-isquiotibiales-tumbado/imagen-1792325484034-961aa0dc-optimized-q92-77ec71aa.webp"),
    ("rotacion-lumbar-tumbado-suave/imagen-1788801072019-bfa15e79.jpg", "rotacion-lumbar-tumbado-suave/imagen-1792266785082-19b05064-optimized-q92-cd70ee4a.webp"),
    ("remo-con-banda-de-activacion/imagen-1788713351497-0f8bb539.jpg", "remo-con-banda-de-activacion/imagen-1792265389036-35b7d8fc-optimized-q92-63304a13.webp"),
    ("hollow-hold/imagen-1787676741627-6ab8a2d0.jpg", "hollow-hold/imagen-1792345963599-b91cf17e-optimized-q92-f2416893.webp"),
    ("flexiones/imagen-1788190096710-4aba7ee1.jpg", "flexiones/imagen-1792266609659-e340239f-optimized-q92-4b7b5537.webp"),
    ("remo-sentado-en-polea/imagen-1788723281423-d210cf0e.jpg", "remo-sentado-en-polea/imagen-1792266965129-aee83ad7-optimized-q92-1e28936c.webp"),
    ("russian-twist/imagen-1787675568311-6b5a4aae.jpg", "russian-twist/imagen-1792351291029-98cfc1ce-optimized-q92-cfba8ae2.webp"),
    ("russian-twist/imagen-1787675854306-7babedb8.jpg", "russian-twist/imagen-1792351291029-98cfc1ce-optimized-q92-cfba8ae2.webp"),
    ("russian-twist/imagen-1787675987152-cebec82c.jpg", "russian-twist/imagen-1792351291029-98cfc1ce-optimized-q92-cfba8ae2.webp"),
    ("estiramiento-de-soleo-en-pared/imagen-1788379742404-88140109.jpg", "estiramiento-de-soleo-en-pared/imagen-1792326027172-f33a92cd-optimized-q92-760d2cb9.webp"),
    ("skipping-bajo/imagen-1787674620603-21888570.jpg", "skipping-bajo/imagen-1792352232859-d8fe561e-optimized-q92-d4751e0a.webp"),
    ("estiramiento-de-gemelo-en-pared/imagen-1788378505532-cabb98d9.jpg", "estiramiento-de-gemelo-en-pared/imagen-1792929095500-d757cfea-optimized-q92-2b6a3979.webp"),
    ("face-pull/imagen-1788185137652-3bfb7596.jpg", "face-pull/imagen-1792326488259-41e62af4-optimized-q92-41d75446.webp"),
    ("elevacion-de-gemelos-de-pie/imagen-1787258646978-7d231dbc.jpg", "elevacion-de-gemelos-de-pie/imagen-1792321900632-46730f4d-optimized-q92-c185439e.webp"),
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
    if os.getenv("AUTHORIZED_BATCH_ID") != "CHETESAI-20261119-JPEG-04":
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
        raise SystemExit("Usage: cleanup-jpeg-batch04.py audit|archive|remove|verify")
    operation = sys.argv[1]
    if operation == "audit": validate(before=True)
    elif operation == "archive": archive()
    elif operation == "remove": delete()
    else: validate(before=False)
