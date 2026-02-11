
// all files (images, logos, documents)
export const files: {[fileName: string]: {description: string, url: string}} = {
  plan_negocio: {
    description: "Plan de negocio ChetesAI - Centro de Entrenamiento Personal",
    url: "https://storage.googleapis.com/totalum-live-bucket/chetesai/files/plan_negocio_chetesai.pdf"
  },
  hero_gym: {
    description: "Hero image for gym landing",
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80"
  },
  training_session: {
    description: "Personal training session image",
    url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80"
  },
  gym_equipment: {
    description: "Gym equipment image",
    url: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=800&q=80"
  },
  fitness_motivation: {
    description: "Fitness motivation image",
    url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"
  },
};

// Business plan data
export const businessPlan = {
  name: "ChetesAI",
  fullName: "Centro de Entrenamiento Personal ChetesAI",
  model: "5 clientes diarios (lunes a viernes)",
  monthlyFee: 180, // EUR
  monthlyIncome: 3750, // EUR
  monthlyExpenses: 1750, // EUR
  monthlyProfit: 2000, // EUR
};