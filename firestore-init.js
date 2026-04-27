import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getCompositeSections, saveCompositeSection } from './src/services/compositeConfig.js';
import { DEFAULT_SECTIONS, DEFAULT_BRANCHING_RULES } from './src/services/dynamicCompositeEngine.js';

// Firebase config - update with your own
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initFirestore() {
  console.log('Initializing Firestore with default sections...\n');
  
  // Initialize composite sections
  console.log('Creating default sections...');
  for (const [type, roleData] of Object.entries(DEFAULT_SECTIONS)) {
    for (const [role, questions] of Object.entries(roleData)) {
      if (questions.length === 0) continue;
      
      const sectionData = {
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${role}`,
        type,
        category: type === 'gateway' ? 'gateway' : type,
        role,
        order: getOrderForType(type, role),
        enabled: true,
        condition: getDefaultCondition(type),
        questions: questions.map((q, idx) => ({ ...q, order: idx * 10 })),
        triggersFrom: type === 'module' || type === 'psychosis' || type === 'confirmation' ? ['gateway'] : [],
      };
      
      try {
        await saveCompositeSection(sectionData);
        console.log(`  ✓ Created section: ${sectionData.name}`);
      } catch (err) {
        console.log(`  ✗ Failed to create section ${sectionData.name}:`, err.message);
      }
    }
  }
  
  console.log('\n✓ Firestore initialization complete!');
  console.log('\nNext steps:');
  console.log('1. Visit /admin in your app to manage sections');
  console.log('2. Configure module thresholds in the Module Config tab');
  console.log('3. Customize branching rules as needed');
}

function getOrderForType(type, role) {
  const orders = {
    gateway: 10,
    mania: 20,
    hypomania: 30,
    depression: 40,
    psychosis: 50,
    branch: 60,
    confirmation: 70,
  };
  return orders[type] || 100;
}

function getDefaultCondition(type) {
  switch (type) {
    case 'mania':
      return { type: 'score', dimension: 'maniaScore', operator: '>=', threshold: 2.2 };
    case 'hypomania':
      return { type: 'score', dimension: 'maniaScore', operator: '>=', threshold: 1.5, maxThreshold: 2.2 };
    case 'depression':
      return { type: 'score', dimension: 'depressionScore', operator: '>', threshold: 1.5 };
    case 'psychosis':
      return { type: 'score', dimension: 'maniaScore', operator: '>=', threshold: 3.0 };
    default:
      return { type: 'score', dimension: 'maniaScore', operator: '>=', threshold: 0 };
  }
}

initFirestore().catch(console.error);