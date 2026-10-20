-- Keep all existing media unchanged. Female images are opt-in and independent.
ALTER TABLE public.ejercicios ADD COLUMN IF NOT EXISTS imagen_mujer_url text;
COMMENT ON COLUMN public.ejercicios.imagen_mujer_url IS
  'Imagen específica del modelo mujer; imagen_url conserva la imagen de hombre.';
NOTIFY pgrst, 'reload schema';
