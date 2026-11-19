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
ENCRYPTED_ARCHIVE = "chetesai-jpeg-batch07-rollback.tar.gz.enc"

# Each replacement must still be stored AND referenced by a current exercise.
PAIRS = [
    ("hip-thrust/imagen-1787409379144-3c150210.jpg", "hip-thrust/imagen-1792345865163-e4eb1f54-optimized-q92-6bef41cd.webp"),
    ("extension-de-triceps-sobre-cabeza/imagen-1787399776209-3d416f57.jpg", "extension-de-triceps-sobre-cabeza/imagen-1792345430388-0d9c103b-optimized-q92-4e030dfe.webp"),
    ("pike-push-up/imagen-1787514731915-87786116.jpg", "pike-push-up/imagen-1792347014432-4808bec1-optimized-q92-0d8aff4b.webp"),
    ("puente-de-gluteos/imagen-1788712163464-8adcdde8.jpg", "puente-de-gluteos/imagen-1792328058965-c8866c20-optimized-q92-58d8f1d9.webp"),
    ("flexiones-declinadas/imagen-1787341743226-51d53e38.jpg", "flexiones-declinadas/imagen-1792439087999-90fcb325-optimized-q92-7669611c.webp"),
    ("press-banca-con-barra/imagen-1787082545808.jpeg", "press-banca-con-barra/imagen-1792347324342-b8b82d47-optimized-q92-179cda48.webp"),
    ("extension-de-triceps-sobre-cabeza/imagen-1787400056903-69e7d67a.jpg", "extension-de-triceps-sobre-cabeza/imagen-1792345430388-0d9c103b-optimized-q92-4e030dfe.webp"),
    ("farmer-carry/imagen-1787400320967-309d8b96.jpg", "farmer-carry/imagen-1792345614819-dec4f26f-optimized-q92-add8cf91.webp"),
    ("pajaros-inclinados/imagen-1787411766051-54c42703.jpg", "pajaros-inclinados/imagen-1792345909111-8a91d0ac-optimized-q92-ed5a3c5f.webp"),
    ("fondos-en-paralelas/imagen-1787082260645.jpeg", "fondos-en-paralelas/imagen-1792439142442-f6a7ed28-optimized-q92-fee44a0f.webp"),
    ("sled-push/imagen-1787673762908-666c8a92.jpg", "sled-push/imagen-1792352293685-a53cd6b7-optimized-q92-7c7b169d.webp"),
    ("zancada-con-rotacion-toracica/imagen-1787671503039-2b90509b.jpg", "zancada-con-rotacion-toracica/imagen-1792352696602-e82e71db-optimized-q92-1b7d88ca.webp"),
    ("ab-wheel-rollout/imagen-1787341317822-4ddd0c97.jpg", "ab-wheel-rollout/imagen-1792843044538-11a524db-optimized-q92-2e33a1ff.webp"),
    ("zancada-lateral/imagen-1787672061859-c12f5f14.jpg", "zancada-lateral/imagen-1792352744087-6f0e5a18-optimized-q92-3a6f561e.webp"),
    ("plancha-abdominal/imagen-1787255605086-d24c2c99.jpg", "plancha-abdominal/imagen-1792327387751-d78845e8-optimized-q92-94dfc2aa.webp"),
    ("cruce-de-poleas/imagen-1787170354059-f80c1fe2.jpg", "cruce-de-poleas/imagen-1792337146593-22998ca4-optimized-q92-d7711f28.webp"),
    ("elevacion-de-rodillas-colgado/imagen-1787341549856-3d719314.jpg", "elevacion-de-rodillas-colgado/imagen-1792439018012-0d996bc5-optimized-q92-b7d3cdd0.webp"),
    ("dominadas-supinas/imagen-1787341445055-ba51fb3c.jpg", "dominadas-supinas/imagen-1792438969835-7b67f165-optimized-q92-37030e86.webp"),
    ("zancada-caminando/imagen-1787671340576-5da2213e.jpg", "zancada-caminando/imagen-1792352715313-ca667dc0-optimized-q92-7adb3682.webp"),
    ("cobra-suave/imagen-1787170114583-614e8a97.jpg", "cobra-suave/imagen-1792268865385-dc3fd551-optimized-q92-5af73450.webp"),
    ("curl-con-barra/imagen-1787003929111.jpeg", "curl-con-barra/imagen-1792337498343-b76c82fb-optimized-q92-9ac91739.webp"),
    ("suitcase-carry/imagen-1787673604569-097101eb.jpg", "suitcase-carry/imagen-1792352338353-d86c2a72-optimized-q92-220be705.webp"),
    ("crunch-abdominal/imagen-1787170540364-52542f29.jpg", "crunch-abdominal/imagen-1792268917657-8415ac1e-optimized-q92-e1ea7fce.webp"),
    ("circulos-de-hombros/imagen-1787169871514-73039194.jpg", "circulos-de-hombros/imagen-1792268826569-9e1064ea-optimized-q92-95f7a6ae.webp"),
    ("suitcase-carry/imagen-1787673052102-4db9401d.jpg", "suitcase-carry/imagen-1792352338353-d86c2a72-optimized-q92-220be705.webp"),
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
    if os.getenv("AUTHORIZED_BATCH_ID") != "CHETESAI-20261119-JPEG-07":
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
        raise SystemExit("Usage: cleanup-jpeg-batch07.py audit|archive|remove|verify")
    operation = sys.argv[1]
    if operation == "audit": validate(before=True)
    elif operation == "archive": archive()
    elif operation == "remove": delete()
    else: validate(before=False)
