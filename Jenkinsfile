pipeline {
  agent any
  options {
    timestamps()
    timeout(time: 90, unit: 'MINUTES')
    disableConcurrentBuilds()
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
    stage('Playwright suite') {
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
