# deployment

# Push the frontend
docker build -t riadh15/rental-agency-frontend:latest .
docker push riadh15/rental-agency-frontend:latest

# Push the backend
docker build -t riadh15/rantal-agency-backend:latest .
docker push riadh15/rantal-agency-backend:latest