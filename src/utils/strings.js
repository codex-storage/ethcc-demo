export function autoPluralize(amount, singular) {
  return `${amount} ${amount == 1 ? singular : singular + 's'}`
}
