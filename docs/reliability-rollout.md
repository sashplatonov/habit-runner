# Надёжность, наблюдаемость и план релиза

Локальные переменные окружения описываются в корневом `.env.example` (клиент) и `server/.env.example` (API).

## 1. Auth / multi-user
- API требует JWT access token в заголовке `Authorization: Bearer ...`; логин на `POST /auth/login` с `email` (например `demo@habbit-runner.local`) возвращает access + refresh.
- Refresh token обновляет access через `POST /auth/refresh`, logout просто инвалидирует refresh.
- Guard в `SyncController` вытаскивает `user.id` из токена, что обеспечивает изоляцию между пользователями. Переменная окружения `ALLOW_LEGACY_X_USER=true` позволяет временно использовать `x-user-id` для отладки.

## 2. Метрики и наблюдаемость
- `MetricsService` считает количество `pull`/`push`, средние задержки, конфликты и ошибки.  
- Статусы доступны по `GET /metrics` (без auth); собираются публичные показатели, которые можно подставить в Prometheus/Logstash.
- Любая ошибка синка инкрементирует счётчик ошибок, что отражается в баннере и логах.

## 3. Rollout
1. **Beta (закрытая):** запускаем API локально с `ALLOW_LEGACY_X_USER=true`, `VITE_SYNC_ENABLED=true`, базовыми пользователями и наблюдаем `/metrics`.
2. **Ограниченный промо:** развертываем на staging, включив monitoring (метрики), отключаем `ALLOW_LEGACY_X_USER`, докидана проверка `Authorization`, фиксируем баги.
3. **Full:** включаем public API, подключаем реальную базу (Supabase/Neon), переносим фронт в плавный rollout, отключаем экспериментальные флаги.

## 4. Backward compatibility
- `VITE_SYNC_ENABLED=false` отключает синхронизацию на клиенте и держит все данные в IndexedDB, что полезно при проблемах с API.
- `ALLOW_LEGACY_X_USER` позволяет временно работать с простым `x-user-id` для быстрых проверок в деве.
- Все изменения обёрнуты документацией: если синк падает, можно посмотреть `/metrics` + `OfflineBanner` и вручную перезапустить через кнопку Retry.
