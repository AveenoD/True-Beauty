import re
import html
import json
import xml.etree.ElementTree as ET
from pathlib import Path


def clean_value(v: str) -> str:
    if not v:
        return ""
    v = html.unescape(v)
    v = re.sub(r"<[^>]+>", "", v)  # strip tags
    v = v.replace("\xa0", " ").strip()
    v = re.sub(r"\s+", " ", v).strip()
    return v


def main() -> None:
    in_path = Path(r"D:\Office\True-Beauty-Anees\True_Beauty_ERD_final.drawio.xml")
    out_path = Path(r"D:\Office\True-Beauty-Anees\tools\_erd_tables.json")

    text = in_path.read_text(encoding="utf-8", errors="ignore")
    root = ET.fromstring(text)

    cells = [c for c in root.iter() if c.tag.endswith("mxCell")]
    parent_of = {
        c.attrib["id"]: c.attrib.get("parent")
        for c in cells
        if "id" in c.attrib
    }

    tables: dict[str, dict] = {}
    for c in cells:
        a = c.attrib
        if a.get("parent") == "1" and "style" in a and "shape=table;" in a["style"]:
            tname = clean_value(a.get("value", ""))
            if tname:
                tables[a["id"]] = {"id": a["id"], "name": tname, "columns": []}

    type_words = {
        "uuid",
        "string",
        "text",
        "int",
        "integer",
        "boolean",
        "enum",
        "date",
        "time",
        "timestamp",
        "json",
        "url",
        "decimal",
        "float",
        "double",
        "String",
        "TEXT[ ]",
    }
    key_words = {"PK", "FK", "UK", "Fk"}

    def find_table_ancestor(cell_id: str) -> str | None:
        seen: set[str] = set()
        cur: str | None = cell_id
        while cur and cur not in seen:
            seen.add(cur)
            if cur in tables:
                return cur
            cur = parent_of.get(cur)
        return None

    for c in cells:
        cid = c.attrib.get("id")
        if not cid:
            continue
        tid = find_table_ancestor(cid)
        if not tid:
            continue
        v = clean_value(c.attrib.get("value", ""))
        if not v:
            continue
        if v in key_words:
            continue
        if "|" in v and len(v) > 20:
            continue
        if "rgb(" in v or "font-family" in v:
            continue
        if v in type_words and "_" not in v:
            continue
        if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", v):
            continue

        tables[tid]["columns"].append(v)

    for t in tables.values():
        seen: set[str] = set()
        deduped: list[str] = []
        for col in t["columns"]:
            if col not in seen:
                seen.add(col)
                deduped.append(col)
        t["columns"] = deduped

    out = {
        "table_count": len(tables),
        "tables": sorted(tables.values(), key=lambda x: x["name"].lower()),
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"Wrote {out_path} with {out['table_count']} tables")


if __name__ == "__main__":
    main()

