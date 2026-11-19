#!/usr/bin/env python3
"""One-time controlled cleanup of 20 inactive PNG images in Chetesaí Storage.

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
ENCRYPTED_ARCHIVE = "chetesai-png-batch02-rollback.tar.gz.enc"

# Each replacement must still be stored AND referenced by a current exercise.
PAIRS = [
    ("sentadilla-profunda-asistida-dinamica/imagen-1792236360070-ed4b76c0.png", "sentadilla-profunda-asistida-dinamica/imagen-1792266212617-43790453-optimized-q92-4131deca.webp"),
    ("sentadilla-al-banco/imagen-1792237552302-7a029fdc.png", "sentadilla-al-banco/imagen-1792266697533-0d0fb9c3-optimized-q92-afb2b23c.webp"),
    ("sentadilla-libre/imagen-1792236140960-b46bc3d6.png", "sentadilla-libre/imagen-1792522484968-59f20940-optimized-q92-07e99086.webp"),
    ("remo-sentado-en-polea/imagen-1792238607020-442a598c.png", "remo-sentado-en-polea/imagen-1792266965129-aee83ad7-optimized-q92-1e28936c.webp"),
    ("scapular-push-up/imagen-1792237304644-c3d6b71a.png", "scapular-push-up/imagen-1792328210635-d74a1362-optimized-q92-eb016fcc.webp"),
    ("curl-femoral-en-trx-mujer/imagen-1793132256512-f9cc0538.png", "curl-femoral-en-trx-mujer/imagen-1793215694411-c7824715-optimized-q92-561b4860.webp"),
    ("monster-walk-con-minibanda-hombre/imagen-1793393835003-2e7c0159.png", "monster-walk-con-minibanda-hombre/imagen-1793393989279-ac866b05-optimized-q92-8afe4339.webp"),
    ("step-up/imagen-1792236545674-297fc650.png", "step-up/imagen-1792266282344-6e98cc73-optimized-q92-1bdd1939.webp"),
    ("rotacion-externa-con-banda/imagen-1792238109001-80be42be.png", "rotacion-externa-con-banda/imagen-1792266886893-9f32c869-optimized-q92-8e2fdc2d.webp"),
    ("bisagra-de-cadera-con-pica-hombre/imagen-1793393107586-42e5bbb9.png", "bisagra-de-cadera-con-pica-hombre/imagen-1793393943297-d0f4f953-optimized-q92-d4f6a9cd.webp"),
    ("aperturas-con-mancuernas/imagen-1787396543369-b1a98684.png", "aperturas-con-mancuernas/imagen-1792336898764-841c186a-optimized-q92-1e9ad30b.webp"),
    ("aperturas-con-mancuernas/imagen-1787345058200-a49eb3d9.png", "aperturas-con-mancuernas/imagen-1792336898764-841c186a-optimized-q92-1e9ad30b.webp"),
    ("curl-inclinado/imagen-1787346177452-efa1ea02.png", "curl-inclinado/imagen-1792337561820-d0014f1c-optimized-q92-407861b8.webp"),
    ("curl-predicador/imagen-1787346431163-d96bf97a.png", "curl-predicador/imagen-1792337736603-4004a51a-optimized-q92-cc1954c1.webp"),
    ("cruce-de-poleas/imagen-1787345237349-a42a9b7a.png", "cruce-de-poleas/imagen-1792337146593-22998ca4-optimized-q92-d7711f28.webp"),
    ("curl-martillo/imagen-1787258220260-31fb0e6e.png", "curl-martillo/imagen-1792321646841-2ea1df0d-optimized-q92-854ec482.webp"),
    ("curl-femoral-tumbado/imagen-1787257869328-4798b77e.png", "curl-femoral-tumbado/imagen-1792321344138-5139bb67-optimized-q92-6cce44de.webp"),
    ("overhead-carry-hombre/imagen-1793393877849-a266c125.png", "overhead-carry-hombre/imagen-1793394024768-72e5283f-optimized-q92-565e5d41.webp"),
    ("aperturas-con-mancuernas/imagen-1787396385142-09b2fff3.png", "aperturas-con-mancuernas/imagen-1792336898764-841c186a-optimized-q92-1e9ad30b.webp"),
    ("curl-zottman/imagen-1787396511965-0f1e272c.png", "curl-zottman/imagen-1792337848253-0e2f45ac-optimized-q92-b740c3a4.webp"),
]

def assert_manifest():
    assert len(PAIRS) == 20 and len({a for a, _ in PAIRS}) == len(PAIRS)
    for original, replacement in PAIRS:
        assert original.lower().endswith(".png")
        assert replacement.endswith(".webp")
        assert not original.startswith("zancada-atras-con-press-encima"), "New exercise PNG is protected"
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
        "  IF (SELECT count(*) FROM storage.objects WHERE bucket_id='exercise-media' AND lower(right(name,5))='.webp') < 332 THEN RAISE EXCEPTION 'WebP count below protected baseline'; END IF;",
        "  IF NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name='zancada-atras-con-press-encima-hombre/imagen-1795090727025-88122d8b.png') THEN RAISE EXCEPTION 'New male PNG missing'; END IF;",
        "  IF NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name='zancada-atras-con-press-encima-mujer/imagen-1795091043795-747211e5.png') THEN RAISE EXCEPTION 'New female PNG missing'; END IF;",
        "  IF NOT EXISTS(SELECT 1 FROM public.ejercicios e WHERE e.imagen_url like '%/zancada-atras-con-press-encima-hombre/imagen-1795090727025-88122d8b.png' AND e.imagen_mujer_url like '%/zancada-atras-con-press-encima-mujer/imagen-1795091043795-747211e5.png') THEN RAISE EXCEPTION 'New zancada PNG references changed'; END IF;",
        "  IF EXISTS(SELECT 1 FROM public.ejercicios e CROSS JOIN LATERAL (VALUES (e.imagen_url), (e.imagen_mujer_url), (e.miniatura_url), (e.gif_url)) urls(path) WHERE lower(right(urls.path,4))='.png' AND NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND urls.path like '%'||o.name)) THEN RAISE EXCEPTION 'An active exercise PNG is missing'; END IF;",
        " FOR item IN SELECT * FROM (VALUES " + rows + ") AS pairs(original_path,replacement_path) LOOP",
    ]
    if before:
        checks += [
            "  IF NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=item.original_path AND o.created_at < '2026-11-01' AND o.updated_at < '2026-11-15') THEN",
            "    RAISE EXCEPTION 'Expected PNG missing: %',item.original_path; END IF;",
        ]
    else:
        checks += [
            "  IF EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=item.original_path) THEN",
            "    RAISE EXCEPTION 'PNG still present: %',item.original_path; END IF;",
        ]
    checks += [
        "  IF NOT EXISTS(",
        "    SELECT 1 FROM storage.objects w WHERE w.bucket_id='exercise-media' AND w.name=item.replacement_path",
        "    AND EXISTS(SELECT 1 FROM public.ejercicios e WHERE strpos(row_to_json(e)::text,item.replacement_path)>0)",
        "  ) THEN RAISE EXCEPTION 'WebP missing or not referenced: %',item.replacement_path; END IF;",
    ]
    if before:
        checks += [
            "  IF EXISTS(SELECT 1 FROM public.media_optimization_exclusions x WHERE x.original_path=item.original_path) THEN RAISE EXCEPTION 'Protected PNG exclusion: %',item.original_path; END IF;",
            "  IF EXISTS(SELECT 1 FROM public.media_optimization_audit a WHERE a.original_path=item.original_path AND a.status='reverted') THEN RAISE EXCEPTION 'Reverted PNG: %',item.original_path; END IF;",
        ]
    if before:
        checks += [
            "  FOR tab IN SELECT table_name FROM information_schema.tables",
            "    WHERE table_schema='public' AND table_type='BASE TABLE' LOOP",
            "    EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I t WHERE strpos(row_to_json(t)::text,$1)>0)',tab.table_name)",
            "      INTO referenced USING item.original_path;",
            "    IF referenced THEN RAISE EXCEPTION 'PNG is referenced in table %: %',tab.table_name,item.original_path; END IF;",
            "  END LOOP;",
        ]
    checks += [" END LOOP;", "END $safe$;"]
    psql("\n".join(checks))
    print(("Pre-deletion audit OK" if before else "Post-deletion verification OK") + f": {len(PAIRS)} PNGs, active WebP replacements.")

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
            destination = temp / "png" / original
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(content)
            manifest.append({"original": original, "replacement": replacement,
                             "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()})
        (temp / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        tarpath = temp / "archive.tar.gz"
        with tarfile.open(tarpath, "w:gz") as tar:
            tar.add(temp / "manifest.json", arcname="manifest.json")
            tar.add(temp / "png", arcname="png")
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
    if os.getenv("AUTHORIZED_BATCH_ID") != "CHETESAI-20261119-PNG-02":
        raise RuntimeError("Deletion guard is not enabled")
    # Official Supabase Storage API. Never run SQL DELETE on storage.objects.
    response = api_request("DELETE", API_ROOT + "/" + BUCKET,
        {"prefixes": [a for a, _ in PAIRS]})
    parsed = json.loads(response)
    if not isinstance(parsed, list):
        raise RuntimeError("Unexpected Storage API deletion response; verify via SQL")
    print(f"Storage API removal returned {len(parsed)} records, expected {len(PAIRS)}.")
    if len(parsed) != len(PAIRS):
        raise RuntimeError("Storage API did not confirm all PNG removals")

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("audit", "archive", "remove", "verify"):
        raise SystemExit("Usage: cleanup-png-batch02.py audit|archive|remove|verify")
    operation = sys.argv[1]
    if operation == "audit": validate(before=True)
    elif operation == "archive": archive()
    elif operation == "remove": delete()
    else: validate(before=False)
 AND NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND urls.path like '%'||o.name)) THEN RAISE EXCEPTION 'An active exercise PNG is missing'; END IF;",
        " FOR item IN SELECT * FROM (VALUES " + rows + ") AS pairs(original_path,replacement_path) LOOP",
    ]
    if before:
        checks += [
            "  IF NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=item.original_path AND o.created_at < '2026-11-01' AND o.updated_at < '2026-11-15') THEN",
            "    RAISE EXCEPTION 'Expected PNG missing: %',item.original_path; END IF;",
        ]
    else:
        checks += [
            "  IF EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=item.original_path) THEN",
            "    RAISE EXCEPTION 'PNG still present: %',item.original_path; END IF;",
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
    print(("Pre-deletion audit OK" if before else "Post-deletion verification OK") + f": {len(PAIRS)} PNGs, active WebP replacements.")

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
            destination = temp / "png" / original
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(content)
            manifest.append({"original": original, "replacement": replacement,
                             "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()})
        (temp / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        tarpath = temp / "archive.tar.gz"
        with tarfile.open(tarpath, "w:gz") as tar:
            tar.add(temp / "manifest.json", arcname="manifest.json")
            tar.add(temp / "png", arcname="jpeg")
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
    if os.getenv("AUTHORIZED_BATCH_ID") != "CHETESAI-20261119-PNG-02":
        raise RuntimeError("Deletion guard is not enabled")
    # Official Supabase Storage API. Never run SQL DELETE on storage.objects.
    response = api_request("DELETE", API_ROOT + "/" + BUCKET,
        {"prefixes": [a for a, _ in PAIRS]})
    parsed = json.loads(response)
    if not isinstance(parsed, list):
        raise RuntimeError("Unexpected Storage API deletion response; verify via SQL")
    print(f"Storage API removal returned {len(parsed)} records, expected {len(PAIRS)}.")
    if len(parsed) != len(PAIRS):
        raise RuntimeError("Storage API did not confirm all PNG removals")

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("audit", "archive", "remove", "verify"):
        raise SystemExit("Usage: cleanup-png-batch02.py audit|archive|remove|verify")
    operation = sys.argv[1]
    if operation == "audit": validate(before=True)
    elif operation == "archive": archive()
    elif operation == "remove": delete()
    else: validate(before=False)
