;; Veritix Token (VTX) — SIP-010 Fungible Token
;; Mintable by the contract deployer for event rewards and monthly bonuses.
(impl-trait .sip-010-trait.sip-010-trait)

(define-fungible-token veritix-token)

(define-constant ERR_NOT_AUTHORIZED (err u100))
(define-constant ERR_TRANSFER_DISABLED (err u101))

(define-data-var token-name (string-ascii 32) "Veritix Token")
(define-data-var token-symbol (string-ascii 8) "VTX")
(define-data-var token-decimals uint u6)
(define-data-var token-uri (optional (string-utf8 256)) none)
(define-data-var transfer-enabled bool true)
(define-data-var token-owner principal tx-sender)

;; --- SIP-010 Read-Only Functions ---

(define-read-only (get-name)
  (ok (var-get token-name)))

(define-read-only (get-symbol)
  (ok (var-get token-symbol)))

(define-read-only (get-decimals)
  (ok (var-get token-decimals)))

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance veritix-token who)))

(define-read-only (get-total-supply)
  (ok (ft-get-supply veritix-token)))

(define-read-only (get-token-uri)
  (ok (var-get token-uri)))

;; --- SIP-010 Transfer ---

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (var-get transfer-enabled) ERR_TRANSFER_DISABLED)
    (asserts! (is-eq tx-sender sender) ERR_NOT_AUTHORIZED)
    (try! (ft-transfer? veritix-token amount sender recipient))
    (print memo)
    (ok true)))

;; --- Minting (contract owner only) ---

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender (var-get token-owner)) ERR_NOT_AUTHORIZED)
    (ft-mint? veritix-token amount recipient)))

;; --- Admin ---

(define-public (set-token-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get token-owner)) ERR_NOT_AUTHORIZED)
    (var-set token-owner new-owner)
    (ok true)))

(define-public (set-transfer-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get token-owner)) ERR_NOT_AUTHORIZED)
    (var-set transfer-enabled enabled)
    (ok true)))
