// Format validators per provider
export const validators: Record<string, (key: string) => boolean> = {
  fireflies: (key) => key.length >= 32,
  anthropic: (key) => key.startsWith('sk-ant-') && key.length > 20,
  openai: (key) => key.startsWith('sk-') && key.length > 20,
  github: (key) => key.startsWith('ghp_') || key.startsWith('github_pat_') || key.length >= 40,
  resend: (key) => key.startsWith('re_') && key.length > 10,
};

// Expected formats for better error messages
export const expectedFormats: Record<string, string> = {
  fireflies: 'Mínimo 32 caracteres',
  anthropic: 'Deve começar com "sk-ant-" (ex: sk-ant-api03-...)',
  openai: 'Deve começar com "sk-" (ex: sk-proj-...)',
  github: 'Deve começar com "ghp_" ou "github_pat_" (ou ter 40+ caracteres)',
  resend: 'Deve começar com "re_" (ex: re_123abc...)',
};

// Optional connection testers (only called if test_connection = true)
export const testers: Record<string, (key: string) => Promise<boolean>> = {
  fireflies: async (key) => {
    try {
      const res = await fetch('https://api.fireflies.ai/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: '{ user { email } }' }),
      });
      const data = await res.json();
      return !data.errors;
    } catch {
      return false;
    }
  },
  // Anthropic: Don't test with real request (generates cost)
  // Only validate format and let 401 happen in real usage
  anthropic: async (key) => {
    return key.startsWith('sk-ant-') && key.length > 40;
  },
  openai: async (key) => {
    try {
      // GET /models doesn't generate cost
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  },
  github: async (key) => {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { 
          'Authorization': `Bearer ${key}`,
          'Accept': 'application/vnd.github+json',
        },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  },
  resend: async (key) => {
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  },
};

// Provider metadata for UI
export const providerMeta: Record<string, { name: string; description: string; placeholder: string }> = {
  fireflies: {
    name: 'Fireflies.ai',
    description: 'Transcrição automática de reuniões',
    placeholder: 'Cole sua API key do Fireflies',
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    description: 'Análise de entrevistas com IA',
    placeholder: 'sk-ant-...',
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT-4, embeddings e mais',
    placeholder: 'sk-...',
  },
  github: {
    name: 'GitHub',
    description: 'Acesso a repositórios e releases',
    placeholder: 'ghp_... ou github_pat_...',
  },
  resend: {
    name: 'Resend',
    description: 'Envio de emails transacionais (convites)',
    placeholder: 're_...',
  },
};
