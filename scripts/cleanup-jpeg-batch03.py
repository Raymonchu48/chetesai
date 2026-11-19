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
ENCRYPTED_ARCHIVE = "chetesai-jpeg-batch03-rollback.tar.gz.enc"

# Each replacement must still be stored AND referenced by a current exercise.
PAIRS = [
    ("press-banca-con-barra/imagen-1787515389119-5d46cb32.jpg", "press-banca-con-barra/imagen-1792347324342-b8b82d47-optimized-q92-179cda48.webp"),
    ("elevacion-de-gemelos-sentado/imagen-1787398057498-f33df059.jpg", "elevacion-de-gemelos-sentado/imagen-1792322426850-b4209247-optimized-q92-18abe879.webp"),
    ("ab-wheel-rollout/imagen-1787168215626-4a5bbefb.jpg", "ab-wheel-rollout/imagen-1792843044538-11a524db-optimized-q92-2e33a1ff.webp"),
    ("press-arnold/imagen-1787515246028-83f50605.jpg", "press-arnold/imagen-1792347249951-a2a38611-optimized-q92-878aa3c6.webp"),
    ("plancha-lateral/imagen-1787514909010-d5338709.jpg", "plancha-lateral/imagen-1792347197180-c46715e7-optimized-q92-7504394c.webp"),
    ("pallof-press/imagen-1787512644196-d6678fc6.jpg", "pallof-press/imagen-1792346734902-241909e2-optimized-q92-5c7aff6c.webp"),
    ("sentadilla-bulgara/imagen-1787601562014-cfcb069d.jpg", "sentadilla-bulgara/imagen-1792351477702-dfc0abb9-optimized-q92-5ab040b6.webp"),
    ("estiramiento-de-aductores-mariposa/imagen-1787410128567-6f12483d.jpg", "estiramiento-de-aductores-mariposa/imagen-1792323199739-5af4f8ba-optimized-q92-8e39da97.webp"),
    ("elevacion-de-gemelos-de-pie/imagen-1787397828606-b0f5ebd2.jpg", "elevacion-de-gemelos-de-pie/imagen-1792321900632-46730f4d-optimized-q92-c185439e.webp"),
    ("russian-twist/imagen-1787601223410-1fb9cf51.jpg", "russian-twist/imagen-1792351291029-98cfc1ce-optimized-q92-cfba8ae2.webp"),
    ("press-en-maquina-convergente/imagen-1788195598421-81e34534.jpg", "press-en-maquina-convergente/imagen-1792327744724-2041b0d1-optimized-q92-373c43ba.webp"),
    ("curl-de-biceps-con-mancuernas/imagen-1787689007374-af66b9ee.jpg", "curl-de-biceps-con-mancuernas/imagen-1792320970208-d1bf6dc1-optimized-q92-251870c0.webp"),
    ("hollow-hold/imagen-1787409283199-036664c9.jpg", "hollow-hold/imagen-1792345963599-b91cf17e-optimized-q92-f2416893.webp"),
    ("prensa-de-piernas/imagen-1788195035628-ff8883a5.jpg", "prensa-de-piernas/imagen-1792327500482-ebd482d7-optimized-q92-653b1aa1.webp"),
    ("circulos-de-hombros/imagen-1787688619710-1a58ed95.jpg", "circulos-de-hombros/imagen-1792268826569-9e1064ea-optimized-q92-95f7a6ae.webp"),
    ("pajaros-inclinados/imagen-1787504232102-c232bc25.jpg", "pajaros-inclinados/imagen-1792345909111-8a91d0ac-optimized-q92-ed5a3c5f.webp"),
    ("remo-invertido/imagen-1787600584225-00210251.jpg", "remo-invertido/imagen-1792351219381-804f2ac7-optimized-q92-e3ee5e3c.webp"),
    ("movilidad-cervical-controlada/imagen-1788194589791-77623165.jpg", "movilidad-cervical-controlada/imagen-1792327256529-19f1f44f-optimized-q92-b4d93d03.webp"),
    ("flexiones/imagen-1787083275824.jpeg", "flexiones/imagen-1792266609659-e340239f-optimized-q92-4b7b5537.webp"),
    ("marcha-activa-con-braceo/imagen-1788192071733-ff417e40.jpg", "marcha-activa-con-braceo/imagen-1792327203641-b17ffa90-optimized-q92-c8dfd8cb.webp"),
    ("remo-con-mancuerna-a-una-mano/imagen-1787591867354-d2bb9f21.jpg", "remo-con-mancuerna-a-una-mano/imagen-1792351144418-c545c994-optimized-q92-1053f62a.webp"),
    ("farmer-carry/imagen-1787408905790-5c9e5759.jpg", "farmer-carry/imagen-1792345614819-dec4f26f-optimized-q92-add8cf91.webp"),
    ("cat-cow/imagen-1787687099904-d89bbe64.jpg", "cat-cow/imagen-1792268767278-564bf1b0-optimized-q92-af26e6ef.webp"),
    ("remo-al-menton-con-agarre-amplio/imagen-1787591173637-3724fa71.jpg", "remo-al-menton-con-agarre-amplio/imagen-1792351039808-50acdcec-optimized-q92-12fd1892.webp"),
    ("burpee/imagen-1787402907410-2c8c53e7.jpg", "burpee/imagen-1792438879494-835a1bd8-optimized-q92-e85b4940.webp"),
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
    if os.getenv("AUTHORIZED_BATCH_ID") != "CHETESAI-20261119-JPEG-03":
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
        raise SystemExit("Usage: cleanup-jpeg-batch03.py audit|archive|remove|verify")
    operation = sys.argv[1]
    if operation == "audit": validate(before=True)
    elif operation == "archive": archive()
    elif operation == "remove": delete()
    else: validate(before=False)
