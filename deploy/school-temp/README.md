# school-temp VPS Workspace

Disposable Docker workspace template for deploying JustFactor under:

```text
/opt/nops-labs/school-temp
```

The template is self-contained and safe to remove with one script.

## Bootstrap On VPS

```bash
sudo mkdir -p /opt/nops-labs/school-temp
sudo chown -R "$USER":"$USER" /opt/nops-labs/school-temp
cd /opt/nops-labs/school-temp

git clone <REPO_URL> repo

cp repo/deploy/school-temp/docker-compose.yml .
cp repo/deploy/school-temp/Dockerfile.backend .
cp repo/deploy/school-temp/Dockerfile.frontend .
cp repo/deploy/school-temp/.env.example .
mkdir -p scripts data/db data/uploads
cp repo/deploy/school-temp/scripts/*.sh scripts/
chmod +x scripts/*.sh

cp .env.example .env
# Edit .env before public testing:
# - SECRET_KEY
# - VITE_API_URL=http://<VPS_IP_OR_DOMAIN>:8000/api/v1
# - LLM/Supabase/payment secrets when needed

./scripts/setup.sh
```

## Runtime URLs

```text
Backend:  http://<VPS_IP>:8000/docs
Frontend: http://<VPS_IP>:5173
Postgres: localhost:5432 on the VPS
Redis:    localhost:6379 on the VPS
```

## Update After Local Changes

```bash
cd /opt/nops-labs/school-temp/repo
git pull
cd ..
docker-compose up --build -d
```

## Destroy Everything

```bash
cd /opt/nops-labs/school-temp
./scripts/teardown.sh
```

This removes containers, named volumes, database files under `data/`, and the cloned repository.

## Verification

```bash
ls -la /opt/nops-labs/school-temp/
docker-compose config
docker build -t school-temp-backend-dryrun -f Dockerfile.backend repo
docker build -t school-temp-frontend-dryrun -f Dockerfile.frontend repo
test -x scripts/setup.sh && test -x scripts/teardown.sh
ss -tlnp | grep -E '8000|5173|5432|6379'
```
