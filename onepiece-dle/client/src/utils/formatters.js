// src/utils/formatters.js
export const formatTaille = (cm) => {
  return (cm * 0.01).toFixed(2).replace(".", "m");
};
