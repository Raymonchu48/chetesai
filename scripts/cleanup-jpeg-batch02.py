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
ENCRYPTED_ARCHIVE = "chetesai-jpeg-batch02-rollback.tar.gz.enc"

# Each replacement must still be stored AND referenced by a current exercise.
PAIRS = [
    ("y-raise-inclinado/imagen-1787604594555-30fae251.jpg", "y-raise-inclinado/imagen-1792352500936-5e47d671-optimized-q92-7db343d0.webp"),
    ("flexiones-diamante/imagen-1787409033084-3d5995b8.jpg", "flexiones-diamante/imagen-1792345718191-b00ebe80-optimized-q92-695d9ce8.webp"),
    ("estiramiento-de-isquiotibiales-tumbado/imagen-1787412677251-8b24d932.jpg", "estiramiento-de-isquiotibiales-tumbado/imagen-1792325484034-961aa0dc-optimized-q92-77ec71aa.webp"),
    ("bird-dog/imagen-1787168407402-d75d0e68.jpg", "bird-dog/imagen-1792268683346-490c68b1-optimized-q92-6315b126.webp"),
    ("woodchop-en-polea/imagen-1787603279787-76ab48b5.jpg", "woodchop-en-polea/imagen-1792352427034-29f1ef3e-optimized-q92-778c5502.webp"),
    ("estiramiento-de-gluteo-figura-cuatro/imagen-1787412181629-f888aa05.jpg", "estiramiento-de-gluteo-figura-cuatro/imagen-1792323621717-f9acea3f-optimized-q92-ba1bc37c.webp"),
    ("suitcase-carry/imagen-1787603006986-e5cfc743.jpg", "suitcase-carry/imagen-1792352338353-d86c2a72-optimized-q92-220be705.webp"),
    ("sled-push/imagen-1787602623601-d3fc5ea9.jpg", "sled-push/imagen-1792352293685-a53cd6b7-optimized-q92-7c7b169d.webp"),
    ("balanceo-lateral-de-pierna/imagen-1787168324723-63928f59.jpg", "balanceo-lateral-de-pierna/imagen-1792268617841-e096b01b-optimized-q92-304d9e8e.webp"),
    ("estiramiento-de-gemelo-en-pared/imagen-1787411665783-539e4369.jpg", "estiramiento-de-gemelo-en-pared/imagen-1792929095500-d757cfea-optimized-q92-2b6a3979.webp"),
    ("ab-wheel-rollout/imagen-1787253244136-5b724fd8.jpg", "ab-wheel-rollout/imagen-1792843044538-11a524db-optimized-q92-2e33a1ff.webp"),
    ("elevacion-lateral-en-polea/imagen-1787398465221-284f0624.jpg", "elevacion-lateral-en-polea/imagen-1792345106334-b4ef9f59-optimized-q92-441fed2b.webp"),
    ("peso-muerto-rumano/imagen-1787513935017-d32eeeec.jpg", "peso-muerto-rumano/imagen-1792346946400-ea6306cd-optimized-q92-195d122a.webp"),
    ("press-de-banca/imagen-1787516501538-49b962c1.jpg", "press-de-banca/imagen-1792347522832-a89ccf28-optimized-q92-863cc1fe.webp"),
    ("curl-femoral-sentado/imagen-1787689885261-d1f6e8fd.jpg", "curl-femoral-sentado/imagen-1792321175900-1eb22ce6-optimized-q92-ff5b5035.webp"),
    ("balanceo-frontal-de-pierna/imagen-1787168294533-572c0630.jpg", "balanceo-frontal-de-pierna/imagen-1792268573211-0a2661ca-optimized-q92-bc4a2f4e.webp"),
    ("skipping-bajo/imagen-1787601959186-c0e4a7c0.jpg", "skipping-bajo/imagen-1792352232859-d8fe561e-optimized-q92-d4751e0a.webp"),
    ("estiramiento-de-deltoides-posterior/imagen-1787411118814-712c5cdc.jpg", "estiramiento-de-deltoides-posterior/imagen-1792323317520-828d4a44-optimized-q92-d8b81aa8.webp"),
    ("patada-de-gluteo-en-polea/imagen-1787513403469-b2804589.jpg", "patada-de-gluteo-en-polea/imagen-1792346785523-3fd6837c-optimized-q92-3f3be1c7.webp"),
    ("elevacion-de-piernas-tumbado/imagen-1787398229914-6d0cf5e0.jpg", "elevacion-de-piernas-tumbado/imagen-1792337911075-91a2871a-optimized-q92-2d383efe.webp"),
    ("abduccion-de-cadera-con-banda/imagen-1787168253136-42345c08.jpg", "abduccion-de-cadera-con-banda/imagen-1792268505433-c865cad8-optimized-q92-44ae696b.webp"),
    ("press-cerrado/imagen-1787515937183-d82749f2.jpg", "press-cerrado/imagen-1792347390720-56f5081b-optimized-q92-87481116.webp"),
    ("sentadilla-goblet/imagen-1787601680721-2da2a0fa.jpg", "sentadilla-goblet/imagen-1792352166645-5b15840f-optimized-q92-aeb62035.webp"),
    ("ab-wheel-rollout/imagen-1787252810781-509827aa.jpg", "ab-wheel-rollout/imagen-1792843044538-11a524db-optimized-q92-2e33a1ff.webp"),
    ("estiramiento-de-cuadriceps-de-pie/imagen-1787410874465-6cc8363d.jpg", "estiramiento-de-cuadriceps-de-pie/imagen-1792323253131-a7a9570c-optimized-q92-ae941b6b.webp"),
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
    if os.getenv("AUTHORIZED_BATCH_ID") != "CHETESAI-20261119-JPEG-02":
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
        raise SystemExit("Usage: cleanup-jpeg-batch02.py audit|archive|remove|verify")
    operation = sys.argv[1]
    if operation == "audit": validate(before=True)
    elif operation == "archive": archive()
    elif operation == "remove": delete()
    else: validate(before=False)
