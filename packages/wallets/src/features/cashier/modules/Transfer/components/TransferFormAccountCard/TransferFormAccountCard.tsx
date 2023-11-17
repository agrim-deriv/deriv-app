import React from 'react';
import classNames from 'classnames';
import {
    WalletCurrencyCard,
    WalletListCardBadge,
    WalletsAppLinkedWithWalletIcon,
    WalletText,
} from '../../../../../../components';
import useDevice from '../../../../../../hooks/useDevice';
import { TWalletLandingCompanyName } from '../../../../../../types';
import { getActiveWalletIcon, getTradingAppIcon } from '../../helpers';
import type { TAccount } from '../../types';
import './TransferFormAccountCard.scss';

type TProps = {
    account?: TAccount;
    activeWallet?: TAccount;
    type?: 'input' | 'modal';
};

const WalletTransferFormAccountCard: React.FC<TProps> = ({ account, activeWallet, type = 'modal' }) => {
    const { isMobile } = useDevice();
    const isInput = type === 'input';
    const isModal = type === 'modal';

    return (
        <div
            className={classNames('wallets-transfer-form-account-card', {
                'wallets-transfer-form-account-card--is-input': isInput,
                'wallets-transfer-form-account-card--is-modal': isModal,
            })}
        >
            <div className='wallets-transfer-form-account-card__icon-with-badge'>
                <div className='wallets-transfer-form-account-card__icon'>
                    {account?.account_category === 'wallet' ? (
                        <WalletCurrencyCard
                            currency={account?.currencyConfig?.display_code || 'USD'}
                            isDemo={Boolean(account?.demo_account)}
                            size='sm'
                        />
                    ) : (
                        <WalletsAppLinkedWithWalletIcon
                            appIcon={getTradingAppIcon(
                                account,
                                activeWallet?.landingCompanyName as TWalletLandingCompanyName
                            )}
                            currency={activeWallet?.currency || ''}
                            isDemo={Boolean(account?.demo_account)}
                            size='small'
                            walletIcon={getActiveWalletIcon(activeWallet)}
                        />
                    )}
                </div>
                {isInput && isMobile && (
                    <WalletListCardBadge isDemo={Boolean(account?.demo_account)} label={account?.landingCompanyName} />
                )}
            </div>

            <div className='wallets-transfer-form-account-card__content'>
                <WalletText as='p' size={isInput ? '2xs' : 'sm'} weight='bold'>
                    {account?.accountName}
                </WalletText>
                <WalletText size={isInput ? '2xs' : 'xs'}>Balance: {account?.displayBalance}</WalletText>
            </div>

            {isModal && (
                <div className='wallets-transfer-form-account-card__modal-badge'>
                    <WalletListCardBadge isDemo={Boolean(account?.demo_account)} label={account?.landingCompanyName} />
                </div>
            )}
        </div>
    );
};

export default WalletTransferFormAccountCard;