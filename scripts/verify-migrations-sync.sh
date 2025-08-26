#!/bin/bash

# Script para verificar que las migraciones están sincronizadas entre proyecto principal y backoffice

echo "🔍 Verificando sincronización de migraciones..."
echo

# Función para obtener lista de migraciones
get_migrations() {
    local dir=$1
    ls -1 "$dir" | grep -E "^[0-9]" | sort
}

# Obtener migraciones de ambos proyectos
main_migrations=$(get_migrations "prisma/migrations")
backoffice_migrations=$(get_migrations "backoffice/prisma/migrations") 

echo "📁 Migraciones en proyecto principal:"
echo "$main_migrations"
echo

echo "📁 Migraciones en backoffice:"
echo "$backoffice_migrations"
echo

# Comparar migraciones
if [ "$main_migrations" = "$backoffice_migrations" ]; then
    echo "✅ Las migraciones están SINCRONIZADAS"
    echo
    echo "🎯 Migraciones encontradas:"
    echo "$main_migrations" | while read migration; do
        echo "   - $migration"
    done
else
    echo "❌ Las migraciones NO están sincronizadas"
    echo
    echo "🔍 Diferencias encontradas:"
    
    main_only=$(comm -23 <(echo "$main_migrations") <(echo "$backoffice_migrations"))
    if [ ! -z "$main_only" ]; then
        echo "   Solo en proyecto principal:"
        echo "$main_only" | while read migration; do
            echo "     - $migration"
        done
    fi

    backoffice_only=$(comm -13 <(echo "$main_migrations") <(echo "$backoffice_migrations"))
    if [ ! -z "$backoffice_only" ]; then
        echo "   Solo en backoffice:"
        echo "$backoffice_only" | while read migration; do
            echo "     - $migration"
        done
    fi
    
    echo
    echo "💡 Para sincronizar:"
    echo "   1. Copia las migraciones faltantes entre proyectos"
    echo "   2. Ejecuta este script nuevamente"
fi

echo
echo "🚨 IMPORTANTE: Asegúrate de que la migración 20250826000000_fix_payment_amount_column esté presente en ambos proyectos"
