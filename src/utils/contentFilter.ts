import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
  DataSet,
  pattern,
} from "obscenity";

const filipinoDataset = new DataSet<{ originalWord: string }>()
  .addAll(englishDataset)
  .addPhrase((p) =>
    p
      .setMetadata({ originalWord: "putangina" })
      .addPattern(pattern`putangina`)
      .addPattern(pattern`putang ina`)
  )
  .addPhrase((p) => p.setMetadata({ originalWord: "tangina" }).addPattern(pattern`|tangina|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "gago" }).addPattern(pattern`|gago|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "pakyu" }).addPattern(pattern`|pakyu|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "bobo" }).addPattern(pattern`|bobo|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "puki" }).addPattern(pattern`|puki|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "tite" }).addPattern(pattern`|tite|`));
  // add more the same way

const matcher = new RegExpMatcher({
  ...filipinoDataset.build(),
  ...englishRecommendedTransformers,
});

export const containsBadWords = (text: string): boolean =>
  matcher.hasMatch(text);