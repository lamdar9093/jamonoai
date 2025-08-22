// Script simple pour tester la clé API OpenAI

const apiKey = process.env.OPENAI_API_KEY;

async function testOpenAIApi() {
  try {
    console.log('Test de la clé API OpenAI...');
    console.log(`La clé API commence par: ${apiKey.substring(0, 5)}...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello in French' }],
        max_tokens: 10
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Succès! Réponse reçue:');
      console.log(data.choices[0].message.content);
    } else {
      console.error('Erreur API:');
      console.error(`Status: ${response.status}`);
      console.error('Détails:', data);
    }
  } catch (error) {
    console.error('Erreur lors de la requête:', error.message);
  }
}

testOpenAIApi();