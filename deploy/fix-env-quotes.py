from pathlib import Path

p = Path("/srv/rareoud/.env.production")
lines = p.read_text().splitlines()
out = []
for line in lines:
    if line.startswith("ADMIN_NAME=") and not (
        line.startswith('ADMIN_NAME="') or line.startswith("ADMIN_NAME='")
    ):
        val = line.split("=", 1)[1]
        out.append(f'ADMIN_NAME="{val}"')
    else:
        out.append(line)
p.write_text("\n".join(out) + "\n")
p.chmod(0o600)
print("FIXED")
