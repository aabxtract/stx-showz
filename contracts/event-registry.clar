;; event-registry
;; Minimal on-chain event registry for stx-showz.
;; Each event is keyed by an auto-incrementing uint id and owned by its organizer.

(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-EVENT-NOT-FOUND (err u101))
(define-constant ERR-INVALID-INPUT (err u102))
(define-constant ERR-EVENT-PAST (err u103))

(define-data-var last-event-id uint u0)

(define-map events
  { id: uint }
  {
    organizer: principal,
    title: (string-utf8 128),
    description: (string-utf8 512),
    category: (string-ascii 32),
    location: (string-utf8 128),
    image: (string-utf8 256),
    event-date: uint,        ;; unix seconds
    price-ustx: uint,        ;; microSTX per ticket
    tickets-total: uint,
    tickets-sold: uint,
    cancelled: bool,
    created-at: uint         ;; block height
  }
)

(define-map events-by-organizer
  { organizer: principal, id: uint }
  { exists: bool }
)

;; --- Public ---

(define-public (create-event
    (title (string-utf8 128))
    (description (string-utf8 512))
    (category (string-ascii 32))
    (location (string-utf8 128))
    (image (string-utf8 256))
    (event-date uint)
    (price-ustx uint)
    (tickets-total uint))
  (let ((new-id (+ (var-get last-event-id) u1)))
    (asserts! (> (len title) u0) ERR-INVALID-INPUT)
    (asserts! (> tickets-total u0) ERR-INVALID-INPUT)
    (asserts! (>= event-date (unwrap-panic (get-stacks-block-info? time (- stacks-block-height u1)))) ERR-EVENT-PAST)
    (map-set events { id: new-id }
      {
        organizer: tx-sender,
        title: title,
        description: description,
        category: category,
        location: location,
        image: image,
        event-date: event-date,
        price-ustx: price-ustx,
        tickets-total: tickets-total,
        tickets-sold: u0,
        cancelled: false,
        created-at: stacks-block-height
      })
    (map-set events-by-organizer { organizer: tx-sender, id: new-id } { exists: true })
    (var-set last-event-id new-id)
    (print { event: "event-created", id: new-id, organizer: tx-sender })
    (ok new-id)))

(define-public (cancel-event (id uint))
  (let ((evt (unwrap! (map-get? events { id: id }) ERR-EVENT-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get organizer evt)) ERR-NOT-AUTHORIZED)
    (map-set events { id: id } (merge evt { cancelled: true }))
    (print { event: "event-cancelled", id: id })
    (ok true)))

;; --- Read-only ---

(define-read-only (get-event (id uint))
  (map-get? events { id: id }))

(define-read-only (get-last-event-id)
  (var-get last-event-id))

(define-read-only (event-exists (id uint))
  (is-some (map-get? events { id: id })))

(define-read-only (is-organizer (id uint) (who principal))
  (match (map-get? events { id: id })
    evt (is-eq (get organizer evt) who)
    false))

(define-read-only (tickets-left (id uint))
  (match (map-get? events { id: id })
    evt (some (- (get tickets-total evt) (get tickets-sold evt)))
    none))
