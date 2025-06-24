#!/usr/bin/env node

// Script de test pour Resend
require('dotenv').config({ path: '.env.local' });

async function testResend() {
  console.log('🧪 Test de la configuration Resend...');
  


  try {
    const { Resend } = require('resend');
    const resend = new Resend('re_QXNtPiMC_8RhmKqc6KQmcH3ikp5N9U34U');

    console.log('📧 Envoi d\'un email de test...');
    
    const { data, error } = await resend.emails.send({
      from: 'Pointages <noreply@rainago.com>',
        to: ['meshavegas@gmail.com'], // Changez par votre email pour tester
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
