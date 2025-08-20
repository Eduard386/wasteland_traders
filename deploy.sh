#!/bin/bash

# Скрипт для деплоя Wasteland Traders на GitHub Pages

echo "🚀 Начинаем деплой Wasteland Traders..."

# 1. Собираем проект
echo "📦 Собираем проект..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки! Прерываем деплой."
    exit 1
fi

# 2. Переключаемся на gh-pages
echo "🔄 Переключаемся на ветку gh-pages..."
git checkout gh-pages

# 3. Удаляем все файлы кроме .git
echo "🧹 Очищаем ветку gh-pages..."
git rm -rf . 2>/dev/null || true

# 4. Копируем собранные файлы
echo "📋 Копируем собранные файлы..."
cp -r dist/* .

# 5. Удаляем папку dist
rmdir dist

# 6. Добавляем все файлы
echo "➕ Добавляем файлы в git..."
git add .

# 7. Коммитим изменения
echo "💾 Коммитим изменения..."
git commit -m "Deploy $(date +%Y-%m-%d_%H-%M-%S)"

# 8. Пушим на GitHub
echo "📤 Загружаем на GitHub..."
git push origin gh-pages

# 9. Возвращаемся на main
echo "🔄 Возвращаемся на ветку main..."
git checkout main

echo "✅ Деплой завершен!"
echo "🌐 Сайт доступен по адресу: https://eduard386.github.io/wasteland_traders/"
