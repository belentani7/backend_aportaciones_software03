.DEFAULT_GOAL := help

help:
	@printf "make up        Levanta todo el ecosistema\n"
	@printf "make down      Detiene servicios conservando datos\n"
	@printf "make logs      Sigue los logs de todos los servicios\n"
	@printf "make health    Consulta la salud del gateway\n"
	@printf "make test      Ejecuta pruebas de API en contenedor\n"
	@printf "make package   Genera el paquete distribuible excluyendo secretos\n"
	@printf "make backup    Genera un backup comprimido de PostgreSQL\n"

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

health:
	curl --fail --silent --show-error http://127.0.0.1:8080/health

test:
	docker compose run --rm --no-deps -v ./ecosystem/tests:/app/tests:ro api pytest -q /app/tests

package:
	bash scripts/package.sh

backup:
	bash scripts/backup.sh
