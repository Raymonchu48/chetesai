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
ENCRYPTED_ARCHIVE = "chetesai-jpeg-batch06-rollback.tar.gz.enc"

# Each replacement must still be stored AND referenced by a current exercise.
PAIRS = [
    ("zancada-atras/imagen-1787605345378-d66cecbc.jpg", "zancada-atras/imagen-1792352550448-27f8757f-optimized-q92-4431286f.webp"),
    ("plancha-lateral/imagen-1787256076399-88dea050.jpg", "plancha-lateral/imagen-1792347197180-c46715e7-optimized-q92-7504394c.webp"),
    ("press-militar-con-barra/imagen-1787343390261-79334881.jpg", "press-militar-con-barra/imagen-1792520269058-4b828bfa-optimized-q92-53875537.webp"),
    ("press-inclinado-con-barra/imagen-1787343269355-97ac6f66.jpg", "press-inclinado-con-barra/imagen-1792520299280-470e57f1-optimized-q92-b9ccdd24.webp"),
    ("curl-femoral-sentado/imagen-1787254366245-77d6992f.jpg", "curl-femoral-sentado/imagen-1792321175900-1eb22ce6-optimized-q92-ff5b5035.webp"),
    ("extension-de-triceps-en-polea/imagen-1787421929884-cd429163.jpg", "extension-de-triceps-en-polea/imagen-1792326354055-daf3988f-optimized-q92-2d6a8d4a.webp"),
    ("peso-muerto-sumo/imagen-1787343032586-1b24ffab.jpg", "peso-muerto-sumo/imagen-1792441555782-adf7e8b8-optimized-q92-64e13776.webp"),
    ("90-90-de-cadera/imagen-1787252540626-c367e9b4.jpg", "90-90-de-cadera/imagen-1792268412092-576712eb-optimized-q92-c370f0ae.webp"),
    ("extension-de-cuadriceps/imagen-1787421091861-11770c60.jpg", "extension-de-cuadriceps/imagen-1792326290458-39d9e62a-optimized-q92-7ea0ac84.webp"),
    ("curl-de-biceps-con-mancuernas/imagen-1787253708414-e5269af8.jpg", "curl-de-biceps-con-mancuernas/imagen-1792320970208-d1bf6dc1-optimized-q92-251870c0.webp"),
    ("estiramiento-de-triceps-sobre-cabeza/imagen-1787421256232-8c214051.jpg", "estiramiento-de-triceps-sobre-cabeza/imagen-1792326090236-4285763c-optimized-q92-484bb9b7.webp"),
    ("peso-muerto-convencional/imagen-1787342429368-9036658c.jpg", "peso-muerto-convencional/imagen-1792439256877-27fe74ba-optimized-q92-4c5304ea.webp"),
    ("curl-en-polea/imagen-1787253860452-1486a43e.jpg", "curl-en-polea/imagen-1792321113204-7f6759cc-optimized-q92-cad525b9.webp"),
    ("cruce-de-poleas/imagen-1787083229034.jpeg", "cruce-de-poleas/imagen-1792337146593-22998ca4-optimized-q92-d7711f28.webp"),
    ("curl-concentracion/imagen-1787253475404-e57312ab.jpg", "curl-concentracion/imagen-1792320885013-3cf8bb7c-optimized-q92-9b108596.webp"),
    ("estiramiento-dorsal-en-banco/imagen-1787414550733-de0629f6.jpg", "estiramiento-dorsal-en-banco/imagen-1792326147487-6616984e-optimized-q92-a01ce625.webp"),
    ("estiramiento-flexor-de-cadera/imagen-1787414756973-0b3367d9.jpg", "estiramiento-flexor-de-cadera/imagen-1792326219306-4d527e12-optimized-q92-901213a9.webp"),
    ("estiramiento-de-soleo-en-pared/imagen-1787413590849-720ec620.jpg", "estiramiento-de-soleo-en-pared/imagen-1792326027172-f33a92cd-optimized-q92-760d2cb9.webp"),
    ("estiramiento-de-triceps-sobre-cabeza/imagen-1787414107445-9aeb6f90.jpg", "estiramiento-de-triceps-sobre-cabeza/imagen-1792326090236-4285763c-optimized-q92-484bb9b7.webp"),
    ("patada-de-gluteo-en-polea/imagen-1787413055985-3acc3679.jpg", "patada-de-gluteo-en-polea/imagen-1792346785523-3fd6837c-optimized-q92-3f3be1c7.webp"),
    ("press-inclinado-con-mancuernas/imagen-1787083663280.jpeg", "press-inclinado-con-mancuernas/imagen-1792350402026-7435c303-optimized-q92-8b3f040a.webp"),
    ("pallof-press/imagen-1787412605396-6ee999a6.jpg", "pallof-press/imagen-1792346734902-241909e2-optimized-q92-5c7aff6c.webp"),
    ("fondos-en-paralelas/imagen-1787341888457-6e046c40.jpg", "fondos-en-paralelas/imagen-1792439142442-f6a7ed28-optimized-q92-fee44a0f.webp"),
    ("crunch-en-polea/imagen-1787170796329-6fa21c19.jpg", "crunch-en-polea/imagen-1792337454197-8b6cc356-optimized-q92-146cdc22.webp"),
    ("curl-con-barra/imagen-1787171080347-f193a0f3.jpg", "curl-con-barra/imagen-1792337498343-b76c82fb-optimized-q92-9ac91739.webp"),
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
    if os.getenv("AUTHORIZED_BATCH_ID") != "CHETESAI-20261119-JPEG-06":
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
        raise SystemExit("Usage: cleanup-jpeg-batch06.py audit|archive|remove|verify")
    operation = sys.argv[1]
    if operation == "audit": validate(before=True)
    elif operation == "archive": archive()
    elif operation == "remove": delete()
    else: validate(before=False)
