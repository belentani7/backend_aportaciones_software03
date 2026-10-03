# Seguridad y controles operativos

## Secretos

El archivo `.env` contiene las credenciales locales generadas para PostgreSQL y el acceso de operador. Tiene permisos `0600`, está excluido de Git y no debe incluirse en el paquete distribuible. Para cambiar credenciales, genere valores aleatorios nuevos, actualice `.env` y reinicie los servicios.

| Secreto | Uso | Regla |
|---|---|---|
| `POSTGRES_PASSWORD` | Persistencia PostgreSQL | Sólo red interna; nunca exponer como variable cliente. |
| `ADMIN_PASSWORD` | Emisión de token de operador | Valor único, con rotación antes de exponer el panel. |
| `ADMIN_ACCESS_TOKEN` | Autorización Bearer de API | Valor único, no se guarda en el frontend. |

## Red y servicios

La red `core` de Compose es interna. PostgreSQL, Redis, API, worker y scheduler no publican puertos de host. El único puerto expuesto es el gateway Nginx en `127.0.0.1:8080`; para publicar el sistema se debe situar un proxy TLS autenticado delante del gateway, no abrir la base de datos ni Redis.

## Datos y privacidad

Los contactos se almacenan con una única finalidad comercial interna. El campo `consent_marketing` es obligatorio para entrar en la audiencia elegible. La automatización de audiencia sólo cuenta contactos: no envía correos, mensajes ni realiza entregas a terceros. No active ningún proveedor de comunicación hasta documentar finalidad, base legal, baja, retención y responsable del tratamiento aplicables.

## Cobros y cumplimiento

El núcleo registra ofertas, oportunidades y suscripciones operativas; no procesa tarjetas, no ejecuta transferencias y no constituye un proveedor de pagos. Antes de conectar un proveedor de cobro, valide identidad comercial, condiciones, facturación, fiscalidad, reembolsos, privacidad y tratamiento de disputas. Los importes de pipeline o MRR son métricas operativas, no ingresos garantizados ni contabilidad auditada.

## Checklist de despliegue público

- [ ] Cambiar `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_ACCESS_TOKEN` por credenciales de producción únicas.
- [ ] Configurar TLS y una capa adicional de autenticación o VPN antes de abrir el gateway a Internet.
- [ ] Crear backups cifrados y probar restauración de PostgreSQL.
- [ ] Revisar política de privacidad, consentimiento y mecanismos de baja.
- [ ] Conectar pagos y comunicaciones sólo con credenciales de producción en un gestor de secretos.
- [ ] Configurar monitorización de logs, alertas y retención.
- [ ] Aplicar límites de tasa en el proxy perimetral si el API se hace público.
