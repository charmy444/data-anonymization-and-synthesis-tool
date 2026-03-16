# Модель данных и связи (MVP)
1. **Порядок генерации**: Users -> Orders -> Payments/Tickets.
2. **Связи**: 
   - `orders.user_id` ссылается на `users.user_id`.
   - `payments.order_id` ссылается на `orders.order_id`.
3. **Целостность**: Использование контекста предотвращает появление "висячих" ссылок.