#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configuration de Resend pour l\'envoi d\'emails...\n');

// 1. Installer Resend
console.log('📦 Installation de Resend...');
try {
  execSync('pnpm install resend', { stdio: 'inherit' });
  console.log('✅ Resend installé avec succès\n');
} catch (error) {
  console.error('❌ Erreur lors de l\'installation de Resend:', error.message);
  process.exit(1);
}

// 2. Vérifier le fichier .env
const envPath = path.join(process.cwd(), '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 Fichier .env.local trouvé');
} else {
  console.log('📄 Création du fichier .env');
}

// 3. Ajouter les variables d'environnement si elles n'existent pas
const requiredVars = [
  {
    key: 'RESEND_API_KEY',
    value: 'your_resend_api_key_here',
    comment: '# Clé API Resend - Obtenez-la sur https://resend.com/api-keys'
  },
  {
    key: 'RESEND_FROM_EMAIL',
    value: 'Pointages <noreply@rainago.com>',
    comment: '# Email d\'expéditeur (doit être vérifié sur Resend)'
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    value: 'http://localhost:3000',
    comment: '# URL de base de l\'application'
  }
];

let envUpdated = false;

requiredVars.forEach(({ key, value, comment }) => {
  if (!envContent.includes(key)) {
    envContent += `\n${comment}\n${key}=${value}\n`;
    envUpdated = true;
    console.log(`➕ Variable ${key} ajoutée`);
  } else {
    console.log(`✅ Variable ${key} déjà présente`);
  }
});

if (envUpdated) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Fichier .env.local mis à jour\n');
} else {
  console.log('✅ Toutes les variables sont déjà configurées\n');
}

// 4. Créer un fichier de test pour Resend
const testFilePath = path.join(process.cwd(), 'scripts', 'test-resend.js');
const testFileContent = `#!/usr/bin/env node

// Script de test pour Resend
require('dotenv').config({ path: '.env.local' });

async function testResend() {
  console.log('🧪 Test de la configuration Resend...');
  
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
    console.log('❌ RESEND_API_KEY non configurée');
    console.log('📝 Éditez .env.local et ajoutez votre clé API Resend');
    return;
  }

  if (!process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL.includes('yourdomain.com')) {
    console.log('❌ RESEND_FROM_EMAIL non configurée');
    console.log('📝 Éditez .env.local et configurez votre email d\'expéditeur');
    return;
  }

  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('📧 Envoi d\'un email de test...');
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: ['test@example.com'], // Changez par votre email pour tester
      subject: 'Test de configuration Resend',
      html: '<p>Félicitations ! Resend est correctement configuré. 🎉</p>',
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
    } else {
      console.log('✅ Email de test envoyé avec succès !');
      console.log('📧 ID de l\'email:', data.id);
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testResend();
`;

fs.writeFileSync(testFilePath, testFileContent);
fs.chmodSync(testFilePath, '755');
console.log('✅ Script de test créé: scripts/test-resend.js\n');

// 5. Instructions finales
console.log('🎯 Configuration terminée ! Prochaines étapes :\n');
console.log('1. 📝 Éditez .env.local et configurez vos clés API :');
console.log('   - Créez un compte sur https://resend.com');
console.log('   - Vérifiez votre domaine');
console.log('   - Générez une clé API');
console.log('   - Remplacez "your_resend_api_key_here" par votre clé\n');

console.log('2. 🧪 Testez votre configuration :');
console.log('   node scripts/test-resend.js\n');

console.log('3. 🚀 Redémarrez votre application :');
console.log('   npm run dev\n');

console.log('📚 Documentation Resend : https://resend.com/docs');
console.log('✨ Votre application utilise maintenant Resend pour les emails !'); 