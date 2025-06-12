import { z } from 'zod';

export const chaptersSchema = z.object({
  chapters: z.array(
    z.object({
      title: z.string(),
      bulletPoints: z.array(
        z.object({
          text: z.string(),
        })
      ),
    })
  ),
});

export const shortListSchema = z.object({
  shots: z.array(
    z.object({
      scene: z.string(),
      shot: z.string(),
      shot_number: z.string(),
      reference: z.string(),
      description: z.string(),
      people: z.string(),
      places: z.string(),
      shotSize: z.string(),
      action: z.string(),
      dialogue: z.string(),
      location: z.string(),
      specialEffects: z.string(),
      notes: z.string(),
      directorsNotes: z.string(),
    })
  )
});

export const subjectSchema = z.object({
  subjects: z.array(
    z.object({
      name: z.string(),
      category: z.enum(['People', 'Places', 'Props']),
      description: z.string(),
      alias: z.string(),
      active: z.boolean(),
    })
  ),
});
