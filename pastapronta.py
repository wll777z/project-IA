"""PastaPronta: renomeacao em lote com previa e desfazer, sem dependencias."""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

MANIFEST = ".pastapronta-ultimo.json"

def safe_prefix(value):
    value = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", value).strip(" .")
    if not value or value in {".", ".."}:
        raise ValueError("Prefixo invalido.")
    return value

def plan(folder, prefix, extension):
    if not folder.is_dir():
        raise ValueError("Pasta nao encontrada.")
    if extension:
        extension = "." + extension.lstrip(".").lower()
    files = sorted(
        (p for p in folder.iterdir() if p.is_file() and
         p.name != MANIFEST and not p.name.startswith(".pastapronta-tmp-") and
         (not extension or p.suffix.lower() == extension)),
        key=lambda p: p.name.casefold(),
    )
    if not files:
        raise ValueError("Nenhum arquivo encontrado.")
    width = max(3, len(str(len(files))))
    pairs = [(p, folder / f"{prefix}_{i:0{width}d}{p.suffix}")
             for i, p in enumerate(files, 1)]
    source_names = {p.name.casefold() for p, _ in pairs}
    target_names = [p.name.casefold() for _, p in pairs]
    if len(set(target_names)) != len(target_names):
        raise ValueError("Nomes de destino repetidos.")
    for source, target in pairs:
        if target.exists() and target.name.casefold() not in source_names:
            raise ValueError(f"Destino ja existe: {target.name}")
    return [(a, b) for a, b in pairs if a != b]

def apply(folder, pairs):
    manifest = folder / MANIFEST
    if manifest.exists():
        raise ValueError("Ja existe um historico. Desfaca antes de nova aplicacao.")
    # Reserva nomes temporarios antes de mover arquivos, evitando conflitos entre fontes.
    import uuid
    staged = []
    completed = []
    try:
        for src, dst in pairs:
            tmp = folder / (".pastapronta-tmp-" + uuid.uuid4().hex)
            src.rename(tmp)
            staged.append((src, tmp, dst))
        for src, tmp, dst in staged:
            tmp.rename(dst)
            completed.append((src, dst))
        data = {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "changes": [{"from": a.name, "to": b.name} for a, b in pairs],
        }
        manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False),
                            encoding="utf-8")
    except Exception:
        # Recupera o estado original quando possivel.
        for src, dst in reversed(completed):
            if dst.exists() and not src.exists():
                dst.rename(src)
        for src, tmp, _ in reversed(staged):
            if tmp.exists() and not src.exists():
                tmp.rename(src)
        raise

def undo(folder):
    manifest = folder / MANIFEST
    if not manifest.is_file():
        raise ValueError("Nenhum historico de renomeacao encontrado.")
    data = json.loads(manifest.read_text(encoding="utf-8"))
    changes = [(folder / row["from"], folder / row["to"])
               for row in data["changes"]]
    if any(not dst.is_file() or src.exists() for src, dst in changes):
        raise ValueError("Arquivos mudaram desde a execucao; desfazer cancelado.")
    for src, dst in changes:
        dst.rename(src)
    manifest.unlink()
    print(f"Desfeito: {len(changes)} arquivo(s).")

def main():
    parser = argparse.ArgumentParser(
        description="Renomeie arquivos em lote com previa e desfazer.")
    parser.add_argument("pasta", type=Path, help="Pasta com os arquivos")
    parser.add_argument("--prefixo", default="arquivo")
    parser.add_argument("--ext", help="Filtrar extensao, ex: jpg")
    parser.add_argument("--aplicar", action="store_true",
                        help="Executar alteracoes (padrao: somente previa)")
    parser.add_argument("--desfazer", action="store_true")
    args = parser.parse_args()
    folder = args.pasta.expanduser().resolve()
    try:
        if args.desfazer:
            undo(folder)
            return
        pairs = plan(folder, safe_prefix(args.prefixo), args.ext)
        if not pairs:
            print("Nada a renomear.")
            return
        for src, dst in pairs:
            print(f"{src.name}  ->  {dst.name}")
        print(f"Total: {len(pairs)} arquivo(s).")
        if args.aplicar:
            apply(folder, pairs)
            print("Renomeacao concluida. Use --desfazer para reverter.")
        else:
            print("PREVIA: nada foi alterado. Use --aplicar para executar.")
    except (ValueError, OSError, KeyError, json.JSONDecodeError) as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
