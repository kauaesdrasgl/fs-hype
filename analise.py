from pathlib import Path
import zipfile

base = Path("/mnt/data/fs-hype")
p = base / "next.config.ts"
s = p.read_text(encoding="utf-8").replace('{ protocol: "images", hostname: "images.unsplash.com" }', '{ protocol: "https", hostname: "images.unsplash.com" }')
p.write_text(s, encoding="utf-8")

p = base / "package.json"
import json
data = json.loads(p.read_text(encoding="utf-8"))
data["devDependencies"]["@eslint/eslintrc"] = "^3.2.0"
p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

zip_path = Path("/mnt/data/FS-HYPE-inicial.zip")
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for file in base.rglob("*"):
        if file.is_file():
            zf.write(file, Path("fs-hype") / file.relative_to(base))

print("Arquivo revisado e recriado. Corrigida a configuração de imagens e adicionada a dependência do ESLint.")
