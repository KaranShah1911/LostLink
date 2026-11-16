# Home screen campus photo

`vjti-campus.jpg` is the faded background photo on the student Home screen.

| | |
|---|---|
| Subject | VJTI quadrangle and dome, Matunga, Mumbai |
| Source | Wikimedia Commons, [File:VJTI College Quadrangle.jpg](https://commons.wikimedia.org/wiki/File:VJTI_College_Quadrangle.jpg) |
| Author | Paras2130 (own work, 27 May 2020) |
| Licence | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) — free to use and modify with credit to the author and the same licence for the modified image |
| Size | 1500 × 872 px, unmodified original file |

In the app the photo is shown with `resizeMode="cover"` (cropped to fit, never stretched)
and a white translucent layer on top to give it the faded look. The original file is not edited.

It is bundled with the app (loaded with `require` in `src/constants.ts`), so it does not need the internet.
If it ever fails to load, the Home screen falls back to a plain light teal background.

To use a different photo, replace `vjti-campus.jpg` with another landscape image of the same name
and restart Expo with `npx expo start --clear`.
