type ProfileUpdater = (
  updates: { isOnboarded: true },
) => Promise<{ error: Error | null }>;

export async function persistOnboardingCompletion(
  updateProfile: ProfileUpdater,
): Promise<void> {
  const { error } = await updateProfile({ isOnboarded: true });
  if (error) throw error;
}
