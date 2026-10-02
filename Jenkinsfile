pipeline {
  agent any
  options {
    timestamps()
    timeout(time: 90, unit: 'MINUTES')
    disableConcurrentBuilds()
  }
  parameters {
    booleanParam(name: 'DEPLOY_STAGING', defaultValue: false, description: 'Request the staging Render hook after tests pass.')
    booleanParam(name: 'DEPLOY_PRODUCTION', defaultValue: false, description: 'After approval, request the production Render hook for RELEASE_SHA.')
    string(name: 'RELEASE_SHA', defaultValue: '', description: 'Exact 40-character SHA already verified on staging.')
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Environment') {
      steps {
        sh 'java -version'
        sh 'node --version'
        sh 'npm --version'
      }
    }
    stage('Backend tests') {
      steps {
        sh 'chmod +x mvnw && ./mvnw -B -ntp clean test'
      }
    }
    stage('Frontend install') {
      steps {
        dir('frontend') {
          sh 'npm ci'
        }
      }
    }
    stage('Frontend lint') {
      steps {
        dir('frontend') {
          sh 'npm run lint'
        }
      }
    }
    stage('Frontend tests') {
      steps {
        dir('frontend') {
          sh 'npm test'
        }
      }
    }
    stage('Frontend build') {
      steps {
        dir('frontend') {
          sh 'npm run build'
        }
      }
    }
    stage('Docker build') {
      steps {
        sh 'docker build -t simple-bank-backend-ci .'
        sh 'docker build -t simple-bank-frontend-ci ./frontend'
      }
    }
    stage('Terraform fmt') {
      steps {
        sh 'terraform fmt -check -recursive infra/terraform'
      }
    }
    stage('Terraform validate') {
      steps {
        sh '''
          terraform -chdir=infra/terraform/environments/staging init -backend=false
          terraform -chdir=infra/terraform/environments/staging validate
          terraform -chdir=infra/terraform/environments/production init -backend=false
          terraform -chdir=infra/terraform/environments/production validate
        '''
      }
    }
    stage('Playwright smoke') {
      steps {
        sh 'npm ci'
        sh 'npx playwright test --list'
      }
    }
    stage('Security scan') {
      steps {
        sh 'node scripts/secret-scan.mjs'
      }
    }
    stage('Deploy staging') {
      when {
        expression { return params.DEPLOY_STAGING }
      }
      steps {
        withCredentials([string(credentialsId: 'RENDER_STAGING_DEPLOY_HOOK_URL', variable: 'RENDER_HOOK')]) {
          sh '''
            case "$RENDER_HOOK" in
              *\\?*) separator='&' ;;
              *) separator='?' ;;
            esac
            code=$(curl --silent --output /dev/null --write-out "%{http_code}" --request POST "${RENDER_HOOK}${separator}ref=${RELEASE_SHA}")
            echo "Render staging hook HTTP ${code}"
            case "$code" in
              200|201|202) ;;
              *) exit 1 ;;
            esac
          '''
        }
      }
    }
    stage('Playwright staging') {
      when {
        expression { return params.DEPLOY_STAGING }
      }
      steps {
        withCredentials([
          string(credentialsId: 'E2E_ADMIN_USERNAME', variable: 'E2E_ADMIN_USERNAME'),
          string(credentialsId: 'E2E_ADMIN_PASSWORD', variable: 'E2E_ADMIN_PASSWORD'),
          string(credentialsId: 'E2E_CUSTOMER_USERNAME', variable: 'E2E_CUSTOMER_USERNAME'),
          string(credentialsId: 'E2E_CUSTOMER_PASSWORD', variable: 'E2E_CUSTOMER_PASSWORD')
        ]) {
          sh '''
            export E2E_BASE_URL="${E2E_BASE_URL:-https://simple-bank-staging.vercel.app}"
            export E2E_API_BASE_URL="${E2E_API_BASE_URL:-https://simple-bank-api-staging.onrender.com/api}"
            export E2E_REQUIRE_AUTH=true
            npx playwright install --with-deps chromium
            npm run e2e:staging
          '''
        }
      }
    }
    stage('Promote production') {
      when {
        expression { return params.DEPLOY_PRODUCTION }
      }
      steps {
        input message: 'Promote the exact staging SHA to production? This does not force-push.'
        sh '''
          if [ -z "$RELEASE_SHA" ]; then
            echo "RELEASE_SHA is required"
            exit 1
          fi
        '''
        withCredentials([string(credentialsId: 'RENDER_PRODUCTION_DEPLOY_HOOK_URL', variable: 'RENDER_HOOK')]) {
          sh '''
            case "$RENDER_HOOK" in
              *\\?*) separator='&' ;;
              *) separator='?' ;;
            esac
            code=$(curl --silent --output /dev/null --write-out "%{http_code}" --request POST "${RENDER_HOOK}${separator}ref=${RELEASE_SHA}")
            echo "Render production hook HTTP ${code}"
            case "$code" in
              200|201|202) ;;
              *) exit 1 ;;
            esac
          '''
        }
      }
    }
    stage('Artifact archive') {
      steps {
        archiveArtifacts artifacts: 'playwright-report/**,frontend/dist/**,target/surefire-reports/**', allowEmptyArchive: true
      }
    }
  }
  post {
    success {
      echo 'Simple Bank pipeline succeeded'
    }
    failure {
      echo 'Simple Bank pipeline failed'
    }
  }
}
