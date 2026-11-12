import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { InMemoryLocalStore } from '@core/memory/local-store';
import { clinicalStatusPresentation, clinicalTheme } from '@core/ui/theme';
import { runDailyCheckInFlow } from '@core/ui/check-in-flow';
import type { BiologicalState } from '@core/contracts/analizador';
import type { SafetyEvaluation } from '@core/contracts/triaje';

type Bleeding = 'NONE' | 'SPOTTING' | 'MILD' | 'MODERATE' | 'SEVERE';

// Local-first store placeholder: replace with EncryptedSqliteLocalStore (op-sqlite + SQLCipher)
// on device builds so clinical data stays encrypted on-device.
const store = new InMemoryLocalStore();

export default function CheckInScreen() {
  const [pain, setPain] = useState('2');
  const [energy, setEnergy] = useState('4');
  const [bloating, setBloating] = useState(false);
  const [bleeding, setBleeding] = useState<Bleeding>('NONE');
  const [cycleDay, setCycleDay] = useState('10');
  const [message, setMessage] = useState('');
  const [triage, setTriage] = useState<SafetyEvaluation | null>(null);
  const [bio, setBio] = useState<BiologicalState | null>(null);
  const [emergency, setEmergency] = useState<string[] | null>(null);

  const status = useMemo(() => clinicalStatusPresentation(bio?.traffic_light_status ?? 'GREEN'), [bio]);

  async function submit() {
    const painScore = Number(pain);
    const energyLevel = Number(energy);
    const day = Number(cycleDay);
    const result = await runDailyCheckInFlow(store, {
      user_message: message || undefined,
      check_in: {
        pain_score: Number.isFinite(painScore) ? painScore : 0,
        energy_level: Number.isFinite(energyLevel) ? energyLevel : 1,
        bloating,
        bleeding_level: bleeding,
        cycle_day: Number.isFinite(day) && day > 0 ? day : undefined,
      },
    });
    setTriage(result.triage);
    if (result.kind === 'EMERGENCY') {
      setEmergency(result.emergency.reasons);
      setBio(null);
      return;
    }
    setEmergency(null);
    setBio(result.kind === 'SAFE' ? result.biologicalState : null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Check-in diario de endometriosis">
        <Text style={styles.title}>Check-in diario</Text>
        <Text style={styles.subtitle}>Menos de 30 segundos. Tus datos se guardan solo en este dispositivo.</Text>

        <Field label="Dolor EVA (0-10)">
          <TextInput accessibilityLabel="Dolor escala visual analógica de 0 a 10" keyboardType="number-pad" value={pain} onChangeText={setPain} style={styles.input} />
        </Field>
        <Field label="Energía (1-5)">
          <TextInput accessibilityLabel="Energía vital de 1 a 5" keyboardType="number-pad" value={energy} onChangeText={setEnergy} style={styles.input} />
        </Field>
        <Field label="Día del ciclo">
          <TextInput accessibilityLabel="Día del ciclo menstrual" keyboardType="number-pad" value={cycleDay} onChangeText={setCycleDay} style={styles.input} />
        </Field>
        <View style={styles.row}>
          <Text style={styles.label}>Distensión abdominal/digestiva</Text>
          <Switch accessibilityLabel="Distensión abdominal o digestiva" value={bloating} onValueChange={setBloating} />
        </View>
        <Field label="Sangrado (NONE, SPOTTING, MILD, MODERATE, SEVERE)">
          <TextInput accessibilityLabel="Nivel de sangrado" value={bleeding} onChangeText={(v) => setBleeding((v.toUpperCase() as Bleeding) || 'NONE')} style={styles.input} autoCapitalize="characters" />
        </Field>
        <Field label="Mensaje opcional">
          <TextInput accessibilityLabel="Mensaje opcional sobre cómo te sentís" value={message} onChangeText={setMessage} style={styles.input} multiline />
        </Field>

        <Pressable accessibilityRole="button" accessibilityLabel="Guardar check-in" style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Guardar check-in</Text>
        </Pressable>

        {emergency && (
          <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.card, styles.emergency]}>
            <Text style={styles.emergencyTitle}>! Emergencia: buscar atención urgente</Text>
            {emergency.map((reason) => (
              <Text key={reason} style={styles.emergencyText}>• {reason}</Text>
            ))}
            <Text style={styles.emergencyText}>Acudí a un centro de urgencias de inmediato.</Text>
          </View>
        )}

        {!emergency && triage && (
          <View style={[styles.card, { backgroundColor: status.backgroundColor }]} accessibilityLiveRegion={status.accessibilityLiveRegion}>
            <Text style={[styles.statusTitle, { color: status.foregroundColor }]}>{status.icon} {status.label}</Text>
            <Text style={[styles.statusText, { color: status.foregroundColor }]} accessibilityLabel={status.accessibilityLabel}>
              Estado clínico: {bio?.traffic_light_status ?? 'sin ciclo informado'}.
            </Text>
            {bio && (
              <Text style={[styles.statusText, { color: status.foregroundColor }]}>
                Fase: {bio.current_phase} · Día {bio.cycle_day} · Riesgo {bio.projected_risk_window.risk_intensity} ({bio.projected_risk_window.start_day}-{bio.projected_risk_window.end_day})
              </Text>
            )}
            {!bio && <Text style={[styles.statusText, { color: status.foregroundColor }]}>Informá el día de ciclo para ver fase y ventana predictiva.</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: clinicalTheme.color.page },
  container: { padding: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: clinicalTheme.color.textPrimary },
  subtitle: { fontSize: 14, color: clinicalTheme.color.textSecondary, marginBottom: 8 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: clinicalTheme.color.textPrimary },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: clinicalTheme.control.radius, padding: 12, minHeight: 44, color: clinicalTheme.color.textPrimary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  button: { backgroundColor: clinicalTheme.color.focus, borderRadius: clinicalTheme.control.radius, minHeight: clinicalTheme.control.minimumTouchTarget, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  card: { borderRadius: 12, padding: 16, marginTop: 12, gap: 6 },
  emergency: { backgroundColor: clinicalTheme.color.emergencyBackground },
  emergencyTitle: { color: clinicalTheme.color.emergencyForeground, fontSize: 18, fontWeight: '700' },
  emergencyText: { color: clinicalTheme.color.emergencyForeground, fontSize: 14 },
  statusTitle: { fontSize: 18, fontWeight: '700' },
  statusText: { fontSize: 14 },
});
