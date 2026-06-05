# uShare Mobile

Мобільна версія **uShare** — гаманець соціальних профілів для iOS та Android.

Побудовано на **Expo (React Native + TypeScript)** з тим самим Supabase backend, що й веб-версія.

## Можливості (MVP)

- Вхід / реєстрація через Supabase Auth
- Скидання пароля (email + deep link `ushare://reset-password`)
- Перегляд збережених соцпосилань
- Копіювання та відкриття посилань
- Додавання нових профілів
- Копіювання публічного лінку профілю

## Старт

1. Скопіюй `.env.example` → `.env` і встав свої Supabase credentials (ті самі, що для web):

```bash
cp .env.example .env
```

2. Встанови залежності та запусти:

```bash
npm install
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm start        # Expo Dev Tools
```

## Supabase: Password reset

У **Authentication → URL Configuration** додай redirect URLs:

- `http://localhost:5173/reset-password` (веб dev)
- `https://<your-web-domain>/reset-password` (веб prod)
- `ushare://reset-password` (мобільний deep link)

Site URL має відповідати основному веб-домену.

## Password reset flow

1. На екрані **Sign In** натисни **Forgot password?**
2. Введи email → **Send Reset Link**
3. Відкрий лінк з листа:
   - у браузері → веб `/reset-password`
   - у застосунку → `ushare://reset-password` (екран нового пароля)
4. Встанови новий пароль і увійди знову

### Тест deep link у симуляторі

```bash
npx uri-scheme open "ushare://reset-password" --ios
```

(Повний тест потребує валідних `access_token` та `refresh_token` у URL з листа Supabase.)

## Структура

```
mobile/
├── App.tsx                 # Точка входу + deep link handling
├── src/
│   ├── config.ts           # Платформи (Instagram, X, LinkedIn…)
│   ├── types.ts
│   ├── context/AuthContext.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── authRedirect.ts
│   │   └── recoverySession.ts
│   └── screens/
│       ├── AuthScreen.tsx
│       ├── DashboardScreen.tsx
│       └── ResetPasswordScreen.tsx
```

## Наступні кроки

- [ ] Папки (folders) для групування посилань
- [ ] Друзі та пошук користувачів
- [ ] Редагування профілів
- [ ] Іконки платформ
- [ ] Dark mode
