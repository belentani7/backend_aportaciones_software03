# Runbook operativo

## Inicio

El servicio se levanta íntegramente con un único comando:

```bash
make up
```

El gateway queda disponible en `http://127.0.0.1:8080`. Las credenciales de operador se encuentran exclusivamente en `.env`; se usan una vez para iniciar sesión y el panel conserva el token sólo durante la sesión del navegador.

## Ciclo operativo

| Cadencia | Acción | Resultado esperado |
|---|---|---|
| Diario | Revisar pipeline, errores y nuevas oportunidades. | Seguimiento de oportunidades activas. |
| Cada seis horas | Scheduler puntúa leads, guarda métrica y prepara audiencia elegible. | Priorización y trazabilidad sin envío externo. |
| Semanal | Revisar conversión por vertical y rendimiento de ofertas. | Decisión de mantener, mejorar o pausar una oferta. |
| Mensual | Ejecutar backup y revisar suscripciones activas, pausadas y canceladas. | Continuidad operativa y visibilidad de recurrencia. |

## Flujo de monetización responsable

1. Cree una vertical que represente una categoría de cliente o de producto, no una identidad fija del negocio.
2. Publique una oferta con precio, intervalo y estado verificables. Un producto de pago único puede coexistir con una suscripción de mantenimiento, soporte, recursos o actualización periódica.
3. Registre leads sólo con una fuente trazable. El consentimiento se usa exclusivamente para seleccionar campañas autorizadas.
4. Convierta leads cualificados en oportunidades, asigne importe esperado y probabilidad basada en evidencia comercial.
5. Registre suscripciones activas o pruebas tras un acuerdo o cobro real. El MRR se normaliza automáticamente para las frecuencias mensual, anual y semanal.
6. Revise cada oferta con los datos generados: leads, oportunidades, conversión, pipeline, recurrencia y retención. Suspenda las líneas que no demuestren tracción suficiente y reasigne esfuerzo a las que sí la tengan.

El sistema evita prometer, simular o ejecutar ingresos. Su función es reducir desorden operativo y convertir información comercial real en decisiones repetibles.

## Automatizaciones

| Nombre | Efecto | Restricción |
|---|---|---|
| `lead_scoring` | Calcula score y cualifica contactos que superan el umbral. | No contacta a nadie. |
| `metrics_snapshot` | Calcula y persiste MRR, pipeline y cartera. | No altera ofertas ni cobros. |
| `campaign_audience` | Cuenta la audiencia con consentimiento y etapa elegible. | La entrega se mantiene desactivada. |

## Mantenimiento

```bash
make health
make logs
make test
make backup
make package
```

`make down` detiene servicios sin borrar los volúmenes. Para eliminar todos los datos de forma intencionada se requiere una operación manual separada; no existe un comando destructivo en este proyecto.

## Integraciones externas futuras

La arquitectura permite conectar pagos, facturación y mensajería mediante adaptadores externos, pero éstos no se han habilitado porque requieren cuentas, contratos, claves y revisión de cumplimiento. Antes de activar cualquier canal, defina responsable, finalidad, consentimiento, mecanismo de baja, retención, condiciones de cobro y proceso de soporte.
