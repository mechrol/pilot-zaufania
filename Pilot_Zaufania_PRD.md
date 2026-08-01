# Pilot Zaufania — Dokument Wymagań Produktowych (PRD)

**Architektura „matrioszki” 4 modułów:** rezerwacja • dzienniczek refleksyjny • rejestrator zdarzeń • smart kontrakt
**Wdrożenie na platformie foxora.ai**

| Pole | Wartość |
|---|---|
| Nazwa produktu | Pilot Zaufania |
| Platforma wdrożeniowa | foxora.ai |
| Wersja dokumentu | 0.1 (Draft do konsultacji) |
| Data | 1 sierpnia 2026 |
| Status | Do przeglądu — wymaga zatwierdzenia właściciela produktu |
| Materiał źródłowy | index.html (QuickRide, „Bezpieczna podróż") + referencyjny link demo taxi-cab-booking |
| Typ architektury | 4-modułowa aplikacja zagnieżdżona (matrioszka) |

---

## Spis treści

1. [Streszczenie wykonawcze](#1-streszczenie-wykonawcze)
2. [Kontekst biznesowy i problem](#2-kontekst-biznesowy-i-problem)
3. [Cele produktu](#3-cele-produktu)
4. [Zakres i założenia](#4-zakres-i-założenia)
5. [Architektura „matrioszki" — koncepcja](#5-architektura-matrioszki--koncepcja)
6. [Interesariusze i persony](#6-interesariusze-i-persony)
7. [Moduł 1 — Frontend główny: Pilot Zaufania](#7-moduł-1--frontend-główny-pilot-zaufania)
8. [Moduł 2 — Dzienniczek „Zwierciadło"](#8-moduł-2--dzienniczek-zwierciadło-refleksyjna-baza-danych)
9. [Moduł 3 — Rejestrator zdarzeń](#9-moduł-3--rejestrator-zdarzeń-trasa-a--b)
10. [Moduł 4 — Smart Kontrakt](#10-moduł-4--smart-kontrakt-raport-zatwierdzający)
11. [Przepływ danych między modułami](#11-przepływ-danych-między-modułami)
12. [Wymagania niefunkcjonalne](#12-wymagania-niefunkcjonalne)
13. [Wymagania prawne i etyczne](#13-wymagania-prawne-i-etyczne)
14. [Kryteria akceptacji (Definition of Done)](#14-kryteria-akceptacji-definition-of-done)
15. [Metryki sukcesu (KPI)](#15-metryki-sukcesu-kpi)
16. [Ryzyka i mitigacje](#16-ryzyka-i-mitigacje)
17. [Plan wdrożenia — fazy](#17-plan-wdrożenia--fazy)
18. [Zależności od platformy foxora.ai](#18-zależności-od-platformy-foxoraai)
19. [Otwarte pytania i decyzje do podjęcia](#19-otwarte-pytania-i-decyzje-do-podjęcia)

---

## 1. Streszczenie wykonawcze

Pilot Zaufania to platforma mobilno-webowa do zamawiania i rozliczania przejazdów, zbudowana z myślą o maksymalnej przejrzystości i weryfikowalności każdego etapu podróży. Produkt opiera się na koncepcji „matrioszki" — czterech zagnieżdżonych aplikacji, z których każda kolejna warstwa dodaje głębszy poziom dokumentowania, refleksji i rozliczenia przejazdu.

Warstwa zewnętrzna (Moduł 1) to znany interfejs rezerwacji przejazdu (na bazie dostarczonego pliku index.html / referencyjnego demo taxi-cab-booking). Wewnątrz niej działa Moduł 2 — Dzienniczek „Zwierciadło", czyli refleksyjna baza danych o funkcji edukacyjnej, w której pasażer i kierowca mogą odnotowywać swoje spostrzeżenia i uczyć się na podstawie przejazdów. Moduł 3 to rejestrator zdarzeń działający w tle podczas realizacji trasy z punktu A do punktu B, którego zakres zależy od dostępnego wyposażenia rejestrującego (notatnik, telefon, wideo, GPS, radar, komputer pokładowy). Moduł 4, Smart Kontrakt, zamyka cały proces — agreguje wszystkie zarejestrowane zdarzenia oraz profile uczestników (pasażer, kierowca, pojazd, otoczenie) i prowadzi strony do wspólnego zatwierdzenia (podpisania) końcowych kosztów podróży.

Celem tego dokumentu jest zdefiniowanie wymagań funkcjonalnych i niefunkcjonalnych dla wszystkich czterech modułów, ich wzajemnych zależności, modelu danych, wymagań sprzętowych, zgodności prawnej oraz planu wdrożenia na platformie foxora.ai.

---

## 2. Kontekst biznesowy i problem

Rynek przejazdów typu ride-hailing boryka się z powtarzającym się problemem: brakiem obopólnie zaufanego, niezależnego zapisu przebiegu podróży. Spory o trasę, czas, zachowanie stron czy końcową cenę są trudne do rozstrzygnięcia, ponieważ dane pochodzą wyłącznie z systemu jednej strony (operatora).

**Problem, który rozwiązujemy:**

- Pasażerowie i kierowcy nie mają wspólnego, niezależnego źródła prawdy o przebiegu przejazdu.
- Rozliczenie kosztów odbywa się „na słowo" systemu, bez możliwości odniesienia się do konkretnych zdarzeń.
- Brak mechanizmu edukacyjnego, który pomagałby uczestnikom wyciągać wnioski z przejazdów (bezpieczeństwo, jakość obsługi, zachowania na drodze).
- Zróżnicowane wyposażenie kierowców/pojazdów (od zwykłego telefonu po komputery pokładowe) utrudnia standaryzację dowodów zdarzeń.

**Nasza odpowiedź:**

Pilot Zaufania buduje „łańcuch zaufania" — od rezerwacji, przez refleksję i rejestrację zdarzeń, aż po wspólnie zatwierdzony kontrakt kosztowy — tak, aby każda strona miała pełny wgląd w to, na jakiej podstawie ustalono ostateczną cenę i przebieg przejazdu.

---

## 3. Cele produktu

### 3.1 Cele biznesowe

1. Zbudować platformę przejazdów o wyższym poziomie zaufania niż konkurencja, mierzalnym liczbą sporów i czasem ich rozstrzygania.
2. Umożliwić wdrożenie modułowe (matrioszka) na infrastrukturze foxora.ai, z możliwością sprzedaży poszczególnych modułów flotom/operatorom osobno lub w pakiecie.
3. Stworzyć warstwę danych zdarzeń, która w przyszłości może zasilać scoring zaufania kierowców, pasażerów i tras.
4. Zbudować komponent edukacyjny (Dzienniczek „Zwierciadło"), zwiększający retencję i lojalność użytkowników.

### 3.2 Cele produktowe (mierzalne w MVP)

- Każdy zakończony przejazd posiada komplet zdarzeń rejestrowanych zgodnie z poziomem wyposażenia kierowcy.
- Każdy przejazd kończy się dwustronnym (lub wielostronnym) zatwierdzeniem Smart Kontraktu przed rozliczeniem płatności.
- Pasażer i kierowca mają dostęp do Dzienniczka „Zwierciadło" po każdym przejeździe.
- Czas między zakończeniem trasy a zatwierdzeniem Smart Kontraktu nie przekracza ustalonego progu SLA (do zdefiniowania z foxora.ai).

---

## 4. Zakres i założenia

### 4.1 W zakresie MVP

- Moduł 1 — interfejs rezerwacji (adaptacja dostarczonego index.html).
- Moduł 2 — Dzienniczek „Zwierciadło" w wersji podstawowej (wpisy tekstowe, prompty refleksyjne).
- Moduł 3 — rejestrator zdarzeń w wariancie „podstawowym" i „telefon+GPS".
- Moduł 4 — Smart Kontrakt z prostym przepływem zatwierdzenia dwustronnego (pasażer + kierowca).

### 4.2 Poza zakresem MVP (kolejne fazy)

- Integracja z radarem i komputerem pokładowym pojazdu (wymaga partnerstw sprzętowych).
- Automatyczny scoring zaufania oparty na uczeniu maszynowym.
- Wielostronne zatwierdzanie z udziałem ubezpieczyciela / floty jako czwartej strony.
- Publiczne API dla operatorów zewnętrznych.

### 4.3 Założenia

- Platforma foxora.ai dostarcza warstwę hostingu, uwierzytelniania oraz (opcjonalnie) płatności — do potwierdzenia w ramach onboardingu technicznego.
- Dane osobowe podlegają RODO; przetwarzanie odbywa się na serwerach w UE lub z odpowiednimi mechanizmami transferu danych.
- Użytkownik końcowy korzysta z urządzenia mobilnego z przeglądarką lub aplikacją hybrydową (WebView).

---

## 5. Architektura „matrioszki" — koncepcja

Architektura opiera się na czterech zagnieżdżonych warstwach aplikacyjnych. Każda kolejna warstwa jest uruchamiana z poziomu poprzedniej (jako widok modalny, zakładka lub przejście kontekstowe), zachowując wspólny identyfikator przejazdu (Ride ID) jako nić łączącą wszystkie moduły.

| # | Moduł | Rola | Analogia |
|---|---|---|---|
| 1 | Frontend główny — Pilot Zaufania | Rezerwacja przejazdu, wybór taryfy, wizualizacja trasy | Zewnętrzna, widoczna „lalka" |
| 2 | Dzienniczek „Zwierciadło" | Refleksyjna baza danych o funkcji edukacyjnej | Druga warstwa — pamięć i nauka |
| 3 | Rejestrator zdarzeń | Dokumentowanie przebiegu trasy A → B w czasie rzeczywistym | Trzecia warstwa — dowód |
| 4 | Smart Kontrakt (raport) | Zatwierdzenie zdarzeń, profili i końcowych kosztów | Najgłębsza warstwa — rozstrzygnięcie |

> Zasada matrioszki: żadna warstwa wewnętrzna nie działa bez warstwy zewnętrznej, ale warstwa zewnętrzna bez warstw wewnętrznych traci swoją wartość różnicującą — staje się zwykłą aplikacją do zamawiania taksówki. To właśnie warstwy 2–4 budują „zaufanie" w nazwie produktu.

---

## 6. Interesariusze i persony

| Persona | Opis | Kluczowe potrzeby |
|---|---|---|
| Pasażer | Osoba zamawiająca przejazd | Szybka rezerwacja, przejrzysta cena, poczucie bezpieczeństwa, możliwość odwołania się do zdarzeń w razie sporu |
| Kierowca | Osoba realizująca przejazd | Uczciwe rozliczenie, ochrona przed fałszywymi zarzutami, prosty proces rejestracji zdarzeń |
| Operator / Dyspozytor floty | Zarządza flotą kierowców w ramach foxora.ai | Wgląd w dane zdarzeń floty, raporty zbiorcze, minimalizacja sporów |
| Administrator platformy foxora.ai | Odpowiada za wdrożenie i utrzymanie | Skalowalna architektura modułowa, łatwa konfiguracja poziomu wyposażenia |
| Audytor / Ubezpieczyciel (opcjonalnie, faza 2+) | Weryfikuje zdarzenia w razie incydentu lub roszczenia | Nienaruszalny, chronologiczny zapis zdarzeń z metadanymi |

---

## 7. Moduł 1 — Frontend główny: Pilot Zaufania

Moduł 1 to warstwa wejściowa aplikacji, oparta na dostarczonym pliku index.html (interfejs „Bezpieczna podróż" / QuickRide, wzorowany na referencyjnym demo taxi-cab-booking). Zachowuje trójetapowy przepływ: podanie lokalizacji odbioru/docelowej → wybór taryfy (Mini / Sedan / SUV) z szacowaną ceną → potwierdzenie i profil kierowcy.

### 7.1 Zmiany względem materiału źródłowego

- Rebranding: nazwa produktu „Pilot Zaufania", komunikaty i nagłówki dostosowane do tożsamości marki foxora.ai.
- Dodanie punktu wejścia do Modułu 2 (Dzienniczek) — widocznego np. jako ikona „Zwierciadło" w nagłówku aplikacji, dostępnego przed i po przejeździe.
- Zastąpienie danych mockowych (MOCK_TRIP_DATA, statyczne ceny) rzeczywistą integracją z usługą geolokalizacji, cenami dynamicznymi i systemem przydziału kierowców foxora.ai.
- Dodanie stanu „Przejazd w toku", który aktywuje Moduł 3 (rejestrator zdarzeń) w tle, niewidoczny dla pasażera, ale sygnalizowany dyskretnym wskaźnikiem statusu.
- Po zakończeniu przejazdu — automatyczne przekierowanie do Modułu 4 (Smart Kontrakt) zamiast bezpośredniego zamknięcia rezerwacji.

### 7.2 Wymagania funkcjonalne

| ID | Wymaganie | Priorytet |
|---|---|---|
| F1.1 | Użytkownik podaje miejsce odbioru i docelowe (ręcznie lub z mapy/GPS) | Must |
| F1.2 | System prezentuje min. 3 kategorie pojazdu z ceną szacunkową | Must |
| F1.3 | Użytkownik wybiera taryfę i potwierdza rezerwację | Must |
| F1.4 | System prezentuje profil przypisanego kierowcy i pojazdu | Must |
| F1.5 | System inicjuje unikalny Ride ID współdzielony z modułami 2–4 | Must |
| F1.6 | Widoczny wskaźnik statusu rejestracji zdarzeń (aktywny/nieaktywny) | Should |
| F1.7 | Punkt wejścia do Dzienniczka „Zwierciadło" dostępny z poziomu nagłówka | Should |
| F1.8 | Po zakończeniu trasy — automatyczne przejście do Smart Kontraktu | Must |

---

## 8. Moduł 2 — Dzienniczek „Zwierciadło" (refleksyjna baza danych)

Moduł 2 pełni funkcję edukacyjną i jest budowany wokół metafory zwierciadła: po każdym przejeździe pasażer i kierowca mogą „przejrzeć się" w krótkiej refleksji dotyczącej doświadczenia, bezpieczeństwa i jakości interakcji. Celem nie jest ocena punktowa (jak klasyczny rating), lecz budowanie nawyku świadomej refleksji, która z czasem tworzy osobisty „dziennik zaufania" użytkownika.

### 8.1 Funkcje kluczowe

- Krótkie, kontekstowe prompty refleksyjne generowane po zakończeniu przejazdu (np. „Co sprawiło, że poczułeś się bezpiecznie w tej podróży?").
- Wpisy tekstowe (opcjonalnie głosowe w fazie 2) przypisane do konkretnego Ride ID.
- Widok historii wpisów w czasie — oś czasu refleksji użytkownika.
- Elementy edukacyjne: krótkie wskazówki dot. bezpieczeństwa, komunikacji i praw pasażera/kierowcy, dobierane kontekstowo.
- Dane z Dzienniczka są prywatne domyślnie — nie są automatycznie ujawniane drugiej stronie ani wykorzystywane w Smart Kontrakcie, chyba że użytkownik świadomie postanowi je załączyć jako kontekst do sporu.

### 8.2 Model danych — JournalEntry

| Pole | Typ | Opis |
|---|---|---|
| entry_id | UUID | Unikalny identyfikator wpisu |
| ride_id | UUID | Powiązanie z przejazdem (Moduł 1/3/4) |
| author_role | Enum | passenger / driver |
| prompt_id | String | Identyfikator zastosowanego promptu refleksyjnego |
| content | Text | Treść wpisu (tekst lub transkrypcja audio) |
| visibility | Enum | private / shared_in_dispute |
| created_at | Timestamp | Data i godzina utworzenia |

### 8.3 Wymagania funkcjonalne

| ID | Wymaganie | Priorytet |
|---|---|---|
| F2.1 | System proponuje 1–3 prompty refleksyjne po zakończeniu przejazdu | Must |
| F2.2 | Wpis w Dzienniczku jest opcjonalny — nie blokuje zakończenia rezerwacji | Must |
| F2.3 | Wpisy widoczne wyłącznie dla ich autora, chyba że autor zmieni widoczność | Must |
| F2.4 | Oś czasu wpisów dostępna z poziomu profilu użytkownika | Should |
| F2.5 | Moduł prezentuje treści edukacyjne dopasowane do typu zdarzeń z danego przejazdu | Could |

---

## 9. Moduł 3 — Rejestrator zdarzeń (trasa A → B)

Moduł 3 działa w tle podczas realizacji przejazdu i dokumentuje zdarzenia istotne dla późniejszego rozliczenia w Smart Kontrakcie. Zakres i szczegółowość rejestrowanych zdarzeń zależą od poziomu wyposażenia rejestracyjnego dostępnego u kierowcy / w pojeździe — moduł musi działać poprawnie zarówno przy minimalnym wyposażeniu (notatnik/telefon), jak i skalować się do zaawansowanych konfiguracji (wideo, GPS, radar, komputer pokładowy).

### 9.1 Poziomy wyposażenia (Tiery)

| Tier | Wyposażenie | Rejestrowane zdarzenia | Sposób zapisu |
|---|---|---|---|
| T0 — Podstawowy | Notatnik ręczny / brak urządzeń | Punkty start/stop, odnotowane ręcznie postoje, uwagi słowne | Wpis ręczny w aplikacji po/w trakcie przejazdu |
| T1 — Telefon | Smartfon kierowcy/pasażera | Start/stop trasy, czas trwania, przybliżona lokalizacja, zdjęcia | Automatyczny zapis znaczników czasu + zdjęcia z aparatu |
| T2 — Telefon + GPS | Smartfon z aktywnym GPS | Pełna trasa GPS, prędkość średnia, przystanki, odchylenia od trasy | Automatyczny log GPS w tle |
| T3 — Wideo | Kamera pokładowa / rejestrator wideo | Nagrania wideo kluczowych momentów, zdarzenia wizualne (np. incydenty) | Automatyczny zapis wideo + znaczniki czasowe zdarzeń |
| T4 — Radar | Radar / czujniki odległości | Zdarzenia bliskiego kontaktu, nagłe hamowania, przekroczenia prędkości | Automatyczne alerty sensoryczne z metadanymi |
| T5 — Komputer pokładowy | Zintegrowany komputer pojazdu (OBD/telemetria) | Zużycie paliwa, styl jazdy, diagnostyka pojazdu, pełna telemetria | Strumień danych telemetrycznych w czasie rzeczywistym |

Moduł 3 musi działać w trybie „progresywnego wzbogacania" — kierowca/pojazd zgłasza dostępny poziom wyposażenia (konfiguracja profilu pojazdu), a system automatycznie dostosowuje zakres rejestrowanych zdarzeń bez zmiany logiki wyższych modułów. Wyższy tier nie zastępuje niższego, lecz go uzupełnia — dane z T0/T1 pozostają zawsze dostępne jako fallback.

### 9.2 Model danych — Event

| Pole | Typ | Opis |
|---|---|---|
| event_id | UUID | Unikalny identyfikator zdarzenia |
| ride_id | UUID | Powiązanie z przejazdem |
| source_tier | Enum | T0–T5, źródło rejestracji zdarzenia |
| event_type | Enum | np. trip_start, trip_end, stop, detour, speed_alert, proximity_alert, video_clip, telemetry_snapshot |
| timestamp | Timestamp | Znacznik czasu zdarzenia |
| geolocation | GeoPoint (nullable) | Współrzędne, jeśli dostępne |
| payload | JSON | Dane szczegółowe zdarzenia (zależne od typu i tieru) |
| evidence_ref | URI (nullable) | Odnośnik do pliku dowodowego (zdjęcie/wideo/log) |
| integrity_hash | String | Suma kontrolna zapewniająca niezmienność zapisu |

### 9.3 Wymagania funkcjonalne

| ID | Wymaganie | Priorytet |
|---|---|---|
| F3.1 | System automatycznie wykrywa dostępny tier wyposażenia na starcie przejazdu | Must |
| F3.2 | Rejestrator zapisuje minimum zdarzenia start/stop trasy niezależnie od tieru | Must |
| F3.3 | Każde zdarzenie posiada niemodyfikowalny znacznik czasu i sumę kontrolną integralności | Must |
| F3.4 | Rejestrator działa w tle bez wymogu ingerencji pasażera | Must |
| F3.5 | Kierowca może ręcznie dodać zdarzenie/notatkę (fallback dla T0) | Must |
| F3.6 | System oznacza zdarzenia wymagające uwagi (np. odchylenie od trasy, nagłe hamowanie) jako „do przeglądu" w Smart Kontrakcie | Should |
| F3.7 | Dane wideo/telemetryczne wysokiej objętości są buforowane lokalnie i synchronizowane asynchronicznie | Should |
| F3.8 | Użytkownik (pasażer/kierowca) może zgłosić zdarzenie ręcznie w czasie rzeczywistym (przycisk alarmowy) | Must |

---

## 10. Moduł 4 — Smart Kontrakt (raport zatwierdzający)

Moduł 4 jest ostatnią i najgłębszą warstwą matrioszki. Jego zadaniem jest zebranie w jeden raport wszystkich zarejestrowanych zdarzeń (Moduł 3) wraz z profilami uczestników — pasażera, kierowcy, pojazdu i otoczenia — oraz doprowadzenie do wspólnego zatwierdzenia (podpisania) końcowych kosztów podróży na podstawie tych danych.

### 10.1 Struktura raportu Smart Kontraktu

- **Sekcja 1 — Podsumowanie przejazdu:** trasa, dystans, czas, taryfa bazowa.
- **Sekcja 2 — Profile uczestników:** profil pasażera (historia, ocena wiarygodności), profil kierowcy (licencja, doświadczenie), profil pojazdu (marka, model, stan techniczny), profil otoczenia (warunki drogowe, pogodowe, natężenie ruchu — jeśli dostępne z tieru T2+).
- **Sekcja 3 — Rejestr zdarzeń:** chronologiczna lista zdarzeń z Modułu 3 wraz z ich klasyfikacją (neutralne / wymagające uwagi / sporne).
- **Sekcja 4 — Kalkulacja kosztów:** sposób wyliczenia końcowej ceny na podstawie taryfy i zarejestrowanych zdarzeń (np. dodatkowy czas postoju, zmiana trasy).
- **Sekcja 5 — Zatwierdzenie:** mechanizm podpisu elektronicznego (potwierdzenia) obu stron, ze znacznikiem czasu i statusem.

### 10.2 Przepływ zatwierdzania

1. Po zakończeniu trasy system generuje wersję roboczą raportu Smart Kontraktu w oparciu o dane z Modułu 3 i profile uczestników.
2. Pasażer i kierowca otrzymują powiadomienie z podglądem raportu.
3. Każda strona może: (a) zatwierdzić raport bez zmian, (b) oznaczyć konkretne zdarzenie jako sporne z komentarzem, (c) odwołać się do wpisu w Dzienniczku „Zwierciadło" jako dodatkowego kontekstu.
4. Jeśli obie strony zatwierdzą raport — status zmienia się na „Zatwierdzony", a płatność zostaje rozliczona zgodnie z finalną kwotą.
5. Jeśli pojawi się spór — raport trafia do statusu „W wyjaśnieniu", z możliwością eskalacji do operatora/dyspozytora (i w fazie 2+ — audytora).
6. Po rozstrzygnięciu sporu raport otrzymuje status końcowy: „Zatwierdzony po korekcie" lub „Odrzucony" (z uzasadnieniem).

### 10.3 Model danych — SmartContractReport

| Pole | Typ | Opis |
|---|---|---|
| contract_id | UUID | Unikalny identyfikator raportu |
| ride_id | UUID | Powiązanie z przejazdem |
| passenger_profile_snapshot | JSON | Migawka profilu pasażera w chwili zamknięcia trasy |
| driver_profile_snapshot | JSON | Migawka profilu kierowcy |
| vehicle_profile_snapshot | JSON | Migawka profilu pojazdu |
| environment_snapshot | JSON (nullable) | Dane o otoczeniu/warunkach, jeśli dostępne |
| event_refs | Array\<event_id\> | Lista powiązanych zdarzeń z Modułu 3 |
| cost_breakdown | JSON | Szczegółowa kalkulacja końcowej ceny |
| status | Enum | draft / pending_approval / disputed / approved / approved_with_correction / rejected |
| passenger_signoff | Object (nullable) | Znacznik czasu i status zatwierdzenia przez pasażera |
| driver_signoff | Object (nullable) | Znacznik czasu i status zatwierdzenia przez kierowcę |

### 10.4 Wymagania funkcjonalne

| ID | Wymaganie | Priorytet |
|---|---|---|
| F4.1 | System automatycznie generuje wersję roboczą raportu po zakończeniu trasy | Must |
| F4.2 | Raport zawiera pełną, chronologiczną listę zdarzeń z Modułu 3 | Must |
| F4.3 | Obie strony muszą jawnie zatwierdzić raport, aby płatność została sfinalizowana | Must |
| F4.4 | Strona może oznaczyć zdarzenie jako sporne wraz z komentarzem | Must |
| F4.5 | System prezentuje przejrzystą kalkulację kosztów odnoszącą się do konkretnych zdarzeń | Must |
| F4.6 | Historia zatwierdzonych/spornych raportów jest dostępna w profilu użytkownika | Should |
| F4.7 | Eskalacja sporu do operatora/dyspozytora z pełnym kontekstem zdarzeń | Should |
| F4.8 | Raport jest eksportowalny do PDF jako dokument dowodowy | Could |

---

## 11. Przepływ danych między modułami

Poniższy przepływ opisuje pełny cykl życia jednego przejazdu przez wszystkie cztery warstwy matrioszki.

1. **Moduł 1:** Pasażer rezerwuje przejazd → generowany jest Ride ID.
2. **Moduł 1 → Moduł 3:** rozpoczęcie trasy uruchamia rejestrator zdarzeń w tle, zgodnie z wykrytym tierem wyposażenia.
3. **Moduł 3** zapisuje zdarzenia w czasie rzeczywistym, powiązane z tym samym Ride ID.
4. **Moduł 1:** zakończenie trasy zamyka aktywną sesję rejestracji zdarzeń.
5. **Moduł 3 → Moduł 4:** wszystkie zdarzenia z danego Ride ID są agregowane do wersji roboczej Smart Kontraktu.
6. **Moduł 4** pobiera profile uczestników (pasażer, kierowca, pojazd, otoczenie) i generuje pełny raport.
7. **Moduł 1/4:** obie strony otrzymują powiadomienie i zatwierdzają raport.
8. **Moduł 2:** równolegle, po zakończeniu trasy, obie strony otrzymują zaproszenie do wpisu w Dzienniczku „Zwierciadło" — proces niezależny od zatwierdzenia Smart Kontraktu, ale mogący zostać do niego dołączony na życzenie strony w razie sporu.

Wspólnym „kręgosłupem" integracyjnym wszystkich modułów jest **Ride ID** — każdy moduł operuje na własnym zestawie danych, ale wszystkie rekordy są powiązane tym samym identyfikatorem, co umożliwia pełną rekonstrukcję historii przejazdu.

---

## 12. Wymagania niefunkcjonalne

| Kategoria | Wymaganie |
|---|---|
| Bezpieczeństwo | Szyfrowanie danych w spoczynku i w transmisji (TLS 1.2+, AES-256). Kontrola dostępu oparta na rolach (pasażer/kierowca/operator/administrator). |
| Integralność danych | Każde zdarzenie w Module 3 i raport w Module 4 posiada sumę kontrolną uniemożliwiającą niepostrzeżoną modyfikację po zapisie. |
| Prywatność / RODO | Zgoda użytkownika na rejestrację zdarzeń (w tym wideo/GPS) wymagana przed pierwszym przejazdem. Wpisy w Dzienniczku domyślnie prywatne. Prawo do wglądu, eksportu i usunięcia danych. |
| Wydajność | Generowanie wersji roboczej Smart Kontraktu w czasie ≤ 30 s od zakończenia trasy dla tierów T0–T2; do 2 min dla T3–T5 (dane wideo/telemetryczne). |
| Skalowalność | Architektura modułowa umożliwiająca niezależne skalowanie Modułu 3 (najbardziej zasobożerny — wideo/telemetria) bez wpływu na Moduł 1. |
| Dostępność | Dostępność Modułu 1 (rezerwacja) ≥ 99,5%. Moduł 3 musi działać offline-first z synchronizacją po odzyskaniu łączności. |
| Dostępność (accessibility) | Zgodność interfejsu z WCAG 2.1 AA dla Modułów 1, 2 i 4. |
| Audytowalność | Pełny log zmian statusu Smart Kontraktu z możliwością odtworzenia historii decyzji. |
| Interoperacyjność sprzętowa | Moduł 3 obsługuje standardowe protokoły telemetryczne (np. OBD-II) oraz proste API dla kamer/rejestratorów zewnętrznych producentów. |

---

## 13. Wymagania prawne i etyczne

- Rejestracja obrazu (wideo) i dźwięku podlega lokalnym przepisom o ochronie prywatności — wymagana jawna zgoda pasażera przed rozpoczęciem nagrywania w pojeździe, o ile prawo tego wymaga.
- Dane telemetryczne pojazdu (T5) muszą być wykorzystywane wyłącznie w zakresie rozliczenia przejazdu, chyba że użytkownik wyrazi odrębną zgodę na cele analityczne.
- Wpisy w Dzienniczku „Zwierciadło" nie mogą być wykorzystywane jako automatyczny dowód w Smart Kontrakcie bez wyraźnej, świadomej zgody ich autora na ujawnienie.
- Okres przechowywania danych zdarzeń (Moduł 3) i raportów (Moduł 4) musi być zgodny z lokalnymi przepisami dot. przechowywania dowodów transakcyjnych oraz polityką retencji foxora.ai — do ustalenia w fazie specyfikacji technicznej.
- Produkt powinien jasno komunikować użytkownikom, jaki poziom wyposażenia rejestrującego jest aktywny podczas danego przejazdu (transparentność wobec pasażera).

---

## 14. Kryteria akceptacji (Definition of Done)

| Moduł | Kryteria akceptacji |
|---|---|
| Moduł 1 | Użytkownik może zrealizować pełną ścieżkę: podanie trasy → wybór taryfy → potwierdzenie → profil kierowcy, z poprawnym wygenerowaniem Ride ID współdzielonego z pozostałymi modułami. |
| Moduł 2 | Po zakończeniu przejazdu obie strony otrzymują zaproszenie do wpisu refleksyjnego; wpis zapisuje się poprawnie i jest widoczny wyłącznie dla autora. |
| Moduł 3 | System poprawnie wykrywa tier wyposażenia i rejestruje minimum zdarzenia start/stop; dane są niemodyfikowalne po zapisie (weryfikowalne przez sumę kontrolną). |
| Moduł 4 | Raport Smart Kontraktu generuje się automatycznie po zakończeniu trasy, zawiera wszystkie powiązane zdarzenia i profile, a płatność jest blokowana do momentu zatwierdzenia przez obie strony. |
| Integracja end-to-end | Pełen cykl testowy: rezerwacja → realizacja trasy z symulowanymi zdarzeniami → wygenerowanie i zatwierdzenie Smart Kontraktu → rozliczenie — zakończony bez błędów integracyjnych dla min. 3 scenariuszy tierów (T0, T2, T3). |

---

## 15. Metryki sukcesu (KPI)

| Metryka | Cel (MVP) |
|---|---|
| Odsetek przejazdów z kompletnym raportem Smart Kontraktu | ≥ 98% |
| Średni czas od zakończenia trasy do zatwierdzenia kontraktu | ≤ 5 minut (T0–T2) |
| Odsetek przejazdów z odnotowanym sporem | Baseline do ustalenia po pierwszych 30 dniach, cel: trend malejący |
| Odsetek użytkowników dodających wpis w Dzienniczku po przejeździe | ≥ 20% w pierwszych 3 miesiącach |
| Dostępność (uptime) Modułu 1 | ≥ 99,5% |

---

## 16. Ryzyka i mitigacje

| Ryzyko | Wpływ | Mitigacja |
|---|---|---|
| Niejednolite wyposażenie kierowców utrudnia standaryzację dowodów | Wysoki | Model tierowy (T0–T5) z jasno zdefiniowanym minimalnym zestawem danych niezależnym od sprzętu |
| Obawy o prywatność przy rejestracji wideo/GPS | Wysoki | Jawne zgody, transparentna komunikacja aktywnego tieru, domyślna prywatność Dzienniczka |
| Duży wolumen danych wideo/telemetrii obciąża infrastrukturę | Średni | Buforowanie lokalne, asynchroniczna synchronizacja, niezależne skalowanie Modułu 3 |
| Spory eskalujące mimo mechanizmu Smart Kontraktu | Średni | Jasna ścieżka eskalacji do operatora/dyspozytora, pełny kontekst zdarzeń dostępny od razu |
| Niska adopcja Dzienniczka „Zwierciadło" (postrzegany jako zbędny krok) | Niski | Opcjonalność wpisu, krótkie prompty, brak wpływu na czas zakończenia rezerwacji |
| Zależność od nieznanych jeszcze możliwości platformy foxora.ai | Średni | Wczesny warsztat techniczny z zespołem foxora.ai w celu potwierdzenia dostępnych usług (auth, płatności, hosting) |

---

## 17. Plan wdrożenia — fazy

### Faza 0 — Fundament (2–3 tygodnie)

- Warsztat techniczny z foxora.ai: potwierdzenie usług platformy (auth, płatności, hosting, limity).
- Rebranding i adaptacja Modułu 1 na bazie dostarczonego index.html.
- Projekt schematu Ride ID i architektury integracyjnej między modułami.

### Faza 1 — MVP (6–8 tygodni)

- Moduł 1 w pełni funkcjonalny, zintegrowany z realnym systemem lokalizacji i przydziału kierowców.
- Moduł 3 w wariantach T0–T2 (notatnik, telefon, telefon+GPS).
- Moduł 4 z prostym, dwustronnym przepływem zatwierdzenia.
- Moduł 2 w wersji podstawowej (wpisy tekstowe, brak audio).

### Faza 2 — Rozszerzenie sprzętowe (kolejne 8–10 tygodni)

- Integracja wideo (T3) oraz podstawowych alertów radarowych (T4).
- Eskalacja sporów do operatora/dyspozytora floty.
- Eksport raportu Smart Kontraktu do PDF.

### Faza 3 — Zaawansowana telemetryka i scoring (kolejne kwartały)

- Integracja z komputerem pokładowym pojazdu (T5, OBD-II).
- Wprowadzenie scoringu zaufania na bazie historii zdarzeń i zatwierdzeń.
- Udział trzeciej strony (audytor/ubezpieczyciel) w procesie zatwierdzania.

---

## 18. Zależności od platformy foxora.ai

Niniejszy PRD zakłada, że platforma foxora.ai dostarcza warstwę hostingową i integracyjną dla wdrożenia. Poniższe elementy wymagają potwierdzenia w ramach onboardingu technicznego z zespołem foxora.ai i nie są obecnie znane autorowi dokumentu:

- Dostępny model uwierzytelniania i zarządzania tożsamością użytkowników.
- Wbudowana obsługa płatności lub konieczność integracji zewnętrznego dostawcy.
- Limity przechowywania i transferu danych (istotne dla Modułu 3 — wideo/telemetria).
- Dostępne mechanizmy powiadomień push/e-mail dla przepływu zatwierdzania Smart Kontraktu.
- Polityka hostingu danych pod kątem zgodności z RODO (lokalizacja serwerów).

> **Rekomendacja:** zorganizować warsztat techniczny z zespołem foxora.ai przed rozpoczęciem Fazy 1, aby zweryfikować powyższe punkty i doprecyzować architekturę integracyjną.

---

## 19. Otwarte pytania i decyzje do podjęcia

1. Czy Smart Kontrakt wymaga podpisu kwalifikowanego / elektronicznego zgodnie z lokalnym prawem, czy wystarczy prosty mechanizm potwierdzenia w aplikacji?
2. Jaki jest docelowy model biznesowy modułów — sprzedaż w pakiecie czy możliwość zakupu pojedynczych modułów przez operatorów flot?
3. Czy Dzienniczek „Zwierciadło" ma mieć element grywalizacji (np. seria refleksji, odznaki), czy pozostać czysto edukacyjny bez mechanik motywacyjnych?
4. Jaki jest oczekiwany okres retencji danych zdarzeń (Moduł 3) — zgodnie z polityką foxora.ai i lokalnymi przepisami?
5. Czy w fazie MVP dopuszczamy przejazdy realizowane wyłącznie w tierze T0 (bez telefonu/GPS), czy telefon jest wymogiem minimalnym?
6. Kto pełni rolę arbitra w przypadku nierozstrzygniętego sporu po eskalacji do operatora — foxora.ai, operator floty, czy zewnętrzny mediator?
