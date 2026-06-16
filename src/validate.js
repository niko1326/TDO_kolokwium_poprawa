function validateName(name) {
  if (typeof name !== "string") return { ok: false, error: "name must be string" };
  const trimmed = name.trim();
  if (trimmed.length === 0) return { ok: false, error: "name is empty" };
  if (trimmed.length > 50) return { ok: false, error: "name too long" };
  return { ok: true, value: trimmed };
}

module.exports = { validateName };
