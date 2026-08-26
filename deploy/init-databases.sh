#!/bin/bash
set -e
for db in productsdb usersdb ordersdb cartsdb paymentsdb reviewsaggregatedb recsdb warehousedb; do
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -c "CREATE DATABASE $db;"
done