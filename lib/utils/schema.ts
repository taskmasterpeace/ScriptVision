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
