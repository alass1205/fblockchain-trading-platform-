                                type="submit"
                                disabled={creating || (tradingMode === 'approval' && needsApproval)}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    backgroundColor: creating || (tradingMode === 'approval' && needsApproval) ? '#6c757d' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: creating || (tradingMode === 'approval' && needsApproval) ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {creating ? '⏳ Création...' : 
                                 tradingMode === 'approval' && needsApproval ? '🔒 Approbation requise' :
                                 `${orderType === 'buy' ? '💰 Acheter' : '💸 Vendre'} ${symbol} (${tradingMode === 'approval' ? 'Direct' : 'Vault'})`}
                            </button>
