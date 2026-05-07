export const formatPercentageText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  const text = String(value);

  return text.replace(/(\d+)\.(\d+)%/g, (_match, integerPart: string, decimalPart: string) => {
    const trimmedDecimal = decimalPart.replace(/0+$/, "");

    if (trimmedDecimal.length === 0) {
      return `${integerPart}%`;
    }

    return `${integerPart}.${trimmedDecimal}%`;
  });
};
