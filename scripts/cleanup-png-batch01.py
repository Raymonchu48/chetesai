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
ENCRYPTED_ARCHIVE = "chetesai-png-batch01-rollback.tar.gz.enc"

# Each replacement must still be stored AND referenced by a current exercise.
PAIRS = [
    ("ab-wheel-rollout/imagen-1792520212281-7f141930.png", "ab-wheel-rollout/imagen-1792843044538-11a524db-optimized-q92-2e33a1ff.webp"),
    ("sentadilla-con-barra-trasera/imagen-1793032570757-05d49ab0.png", "sentadilla-con-barra-trasera/imagen-1792521098340-461fdbf8-optimized-q92-a555066e.webp"),
    ("remo-en-maquina-hombre/imagen-1793042803774-e5470102.png", "remo-en-maquina-hombre/imagen-1793043379310-7904d824-optimized-q92-1b731e1b.webp"),
    ("press-cerrado/imagen-1792347374570-e350682d.png", "press-cerrado/imagen-1792347390720-56f5081b-optimized-q92-87481116.webp"),
    ("ab-wheel-rollout/imagen-1792438824912-1e5456b9.png", "ab-wheel-rollout/imagen-1792843044538-11a524db-optimized-q92-2e33a1ff.webp"),
    ("zancada-caminando/imagen-1792352628719-6b3d6ced.png", "zancada-caminando/imagen-1792352715313-ca667dc0-optimized-q92-7adb3682.webp"),
    ("cargada-y-arrancadas/imagen-1793031739095-dc00ae41.png", "cargada-y-arrancadas/imagen-1793031983821-5d16b144-optimized-q92-bc8fc24b.webp"),
    ("sentadilla-con-barra-trasera/imagen-1793032630435-93249816.png", "sentadilla-con-barra-trasera/imagen-1792521098340-461fdbf8-optimized-q92-a555066e.webp"),
    ("puente-de-gluteos/imagen-1792946473687-fc573a14.png", "puente-de-gluteos/imagen-1792328058965-c8866c20-optimized-q92-58d8f1d9.webp"),
    ("wall-slides/imagen-1792236997186-fe071c21.png", "wall-slides/imagen-1792266474174-5d9c2e9a-optimized-q92-122d23ce.webp"),
    ("sentadilla-libre/imagen-1792266035002-e5c79f82.png", "sentadilla-libre/imagen-1792522484968-59f20940-optimized-q92-07e99086.webp"),
    ("zancada-caminando/imagen-1792352584526-0595e25f.png", "zancada-caminando/imagen-1792352715313-ca667dc0-optimized-q92-7adb3682.webp"),
    ("sentadilla-asistida-en-trx-mujer/imagen-1793388395719-cb7e9f36.png", "sentadilla-asistida-en-trx-mujer/imagen-1793388436789-7027d6d6-optimized-q92-14bf53eb.webp"),
    ("remo-unilateral-en-trx-mujer/imagen-1793388327949-1013d410.png", "remo-unilateral-en-trx-mujer/imagen-1793388424155-b38a91ca-optimized-q92-5356eef0.webp"),
    ("sentadilla-libre/imagen-1792522340348-dcbf002f.png", "sentadilla-libre/imagen-1792522484968-59f20940-optimized-q92-07e99086.webp"),
    ("sentadilla-libre/imagen-1792522373601-98d5af0f.png", "sentadilla-libre/imagen-1792522484968-59f20940-optimized-q92-07e99086.webp"),
    ("sentadilla-libre/imagen-1792522435068-71105efc.png", "sentadilla-libre/imagen-1792522484968-59f20940-optimized-q92-07e99086.webp"),
    ("remo-unilateral-en-trx-mujer/imagen-1793388360543-32af8c23.png", "remo-unilateral-en-trx-mujer/imagen-1793388424155-b38a91ca-optimized-q92-5356eef0.webp"),
    ("rotacion-lumbar-tumbado-suave/imagen-1792237746225-a0f504b1.png", "rotacion-lumbar-tumbado-suave/imagen-1792266785082-19b05064-optimized-q92-cd70ee4a.webp"),
    ("thread-the-needle/imagen-1792236752987-bf34d39b.png", "thread-the-needle/imagen-1792266369409-421fb702-optimized-q92-7eb3a55d.webp"),
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
    if os.getenv("AUTHORIZED_BATCH_ID") != "CHETESAI-20261119-PNG-01":
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
        raise SystemExit("Usage: cleanup-png-batch01.py audit|archive|remove|verify")
    operation = sys.argv[1]
    if operation == "audit": validate(before=True)
    elif operation == "archive": archive()
    elif operation == "remove": delete()
    else: validate(before=False)
