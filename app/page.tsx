async function togglePayment(member: Member) {
  setMessage("⏳ Zahlung wird gespeichert...");

  if (!eventId) {
    setMessage("❌ Kein Event ausgewählt.");
    return;
  }

  // WICHTIG:
  // Wir verwenden ausschließlich die UUID des Profils.
  // Niemals den Namen "Philipp" an payments übergeben.

  const existingPayment = payments.find(
    (payment) =>
      payment.event_id === eventId &&
      payment.profile_id === member.profile_id
  );

  const newStatus =
    existingPayment?.status === "bezahlt"
      ? "offen"
      : "bezahlt";

  if (existingPayment) {
    const { error } = await supabase
      .from("payments")
      .update({
        status: newStatus,
        betrag: amountPerPerson,
        profile_id: member.profile_id,
        bezahlt_von: member.profile_id,
      })
      .eq("id", existingPayment.id);

    if (error) {
      setMessage("❌ Zahlung: " + error.message);
      return;
    }
  } else {
    const { error } = await supabase
      .from("payments")
      .insert({
        event_id: eventId,
        profile_id: member.profile_id,
        bezahlt_von: member.profile_id,
        betrag: amountPerPerson,
        status: newStatus,
      });

    if (error) {
      setMessage("❌ Zahlung: " + error.message);
      return;
    }
  }

  await loadPayments();

  setMessage(
    newStatus === "bezahlt"
      ? `✅ ${member.username} hat bezahlt.`
      : `↩️ ${member.username} wieder auf offen gesetzt.`
  );
}
