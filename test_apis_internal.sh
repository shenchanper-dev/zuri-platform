#!/bin/bash

# Script de pruebas internas para las APIs de Zuri Platform
# Este script verifica todas las APIs implementadas en Fases 1-5

echo "========================================="
echo "🧪 ZURI PLATFORM - INTERNAL API TESTS"
echo "========================================="
echo ""

BASE_URL="http://localhost:3000"
FAILED_TESTS=0
PASSED_TESTS=0

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para test
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4
    local data=$5
    
    echo -n "Testing: $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body" | head -c 200
        echo ""
        ((FAILED_TESTS++))
        return 1
    fi
}

echo "📊 Phase 1: Database & Especialidades API"
echo "----------------------------------------"

# Test 1: GET especialidades
test_api "GET Especialidades" "GET" "/api/especialidades" "200"

echo ""
echo "👨‍⚕️ Phase 3: Doctores API"
echo "----------------------------------------"

# Test 2: GET doctores list
test_api "GET Doctores List" "GET" "/api/doctores?limit=10" "200"

# Test 3: GET doctores with search
test_api "GET Doctores Search" "GET" "/api/doctores?search=max&limit=5" "200"

# Test 4: POST doctor (create test)
DOCTOR_DATA='{
  "dni": "99999999",
  "nombres": "Test",
  "apellido_paterno": "Doctor",
  "apellido_materno": "API",
  "cmp": "TEST99999",
  "especialidad_principal_id": 1,
  "estado": "ACTIVO",
  "tarifa_consulta": 150.00,
  "moneda": "PEN"
}'
test_api "POST Create Doctor" "POST" "/api/doctores" "201" "$DOCTOR_DATA"

echo ""
echo "🏥 Phase 3: Pacientes API"
echo "----------------------------------------"

# Test 5: GET pacientes list
test_api "GET Pacientes List" "GET" "/api/pacientes?limit=10" "200"

# Test 6: GET pacientes with filter
test_api "GET Pacientes Filter" "GET" "/api/pacientes?movilidad_tipo=AMBULATORIO" "200"

# Test 7: POST paciente (create test)
PACIENTE_DATA='{
  "dni": "88888888",
  "nombres": "Test",
  "apellido_paterno": "Paciente",
  "fecha_nacimiento": "1980-01-01",
  "direccion": "Av. Test 123",
  "emergencia_nombre": "Contacto Test",
  "emergencia_telefono": "999999999",
  "movilidad_tipo": "AMBULATORIO",
  "estado": "ACTIVO"
}'
test_api "POST Create Paciente" "POST" "/api/pacientes" "201" "$PACIENTE_DATA"

echo ""
echo "📋 Phase 2: Excel Preview API"
echo "----------------------------------------"

# Test 8: GET importaciones preview (should return 404 for non-existent)
test_api "GET Preview Non-existent" "GET" "/api/importaciones/99999/preview" "404"

echo ""
echo "🤖 Phase 4: ZURI AI Chat API"
echo "----------------------------------------"

# Test 9: POST ZURI chat - fleet status
ZURI_FLEET='{
  "mensaje": "Lista conductores activos"
}'
test_api "ZURI Fleet Status Intent" "POST" "/api/ai/zuri/chat" "200" "$ZURI_FLEET"

# Test 10: POST ZURI chat - service status
ZURI_SERVICE='{
  "mensaje": "Servicios para hoy"
}'
test_api "ZURI Service Status Intent" "POST" "/api/ai/zuri/chat" "200" "$ZURI_SERVICE"

# Test 11: POST ZURI chat - help
ZURI_HELP='{
  "mensaje": "ayuda que puedes hacer"
}'
test_api "ZURI Help Intent" "POST" "/api/ai/zuri/chat" "200" "$ZURI_HELP"

echo ""
echo "========================================="
echo "📊 TEST SUMMARY"
echo "========================================="
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo "Total: $((PASSED_TESTS + FAILED_TESTS))"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED${NC}"
    exit 1
fi
