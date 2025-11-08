pipeline {
    agent any
    environment {
        ENV_FILE=credentials("mtt-env")
        GOOGLE_CREDENTIALS_FILE=credentials("mtt-google-credentials")
        GOOGLE_TOKEN_FILE=credentials("mtt-google-token")
        PORT=8011
        IMAGE_NAME="mtt"
        CONTAINER_NAME="mtt-container"
    }
    stages {
        stage("Setup Environment") {
            steps {
                sh """
                cp $ENV_FILE .env
                cp $GOOGLE_CREDENTIALS_FILE credentials.json
                cp $GOOGLE_TOKEN_FILE token.json
                """
            }
        }
        stage("Build Image") {
            steps {
                sh """
                docker build -t $IMAGE_NAME:latest .
                """
            }
        }
        stage("Database Migration") {
            steps {
                echo "🔄 Running Prisma migrations..."
                sh """
                docker run --rm --network mtt-network ${IMAGE_NAME}:latest npx prisma migrate dev
                """
            }
        }
        stage("Run Container") {
            steps {
                sh """
                docker stop $CONTAINER_NAME || true && docker rm $CONTAINER_NAME || true
                docker run -d --name $CONTAINER_NAME -p $PORT:3000 $IMAGE_NAME:latest
                """
            }
        }
    }
}
