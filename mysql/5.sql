alter table companies 
add column traded tinyint(1) unsigned not null default 0 after sector_id;

update companies set traded = 1 where id in (13, 46, 139, 22, 110, 31, 133, 15, 152, 21, 123, 43, 28, 33, 50, 38, 44, 3, 23, 142, 19, 131, 126, 138, 4, 20, 155, 8, 
127, 147, 115, 32, 24, 148, 40, 41);

insert into companies 
	(name, symbol, sector_id, traded, created_at, updated_at)
	values 
	('Muthoot Finance Ltd', 'MUTHOOTFIN', 1, 1, NOW(), NOW()),
	('NIIT Technologies Ltd', 'NIITTECH', 4, 1, NOW(), NOW()),
	('SRF Ltd', 'SRF', 16, 1, NOW(), NOW()),
	('CESC Ltd', 'CESC', 3, 1, NOW(), NOW()),
	('Mindtree Ltd', 'MINDTREE', 4, 1, NOW(), NOW()),
	('Just Dial Ltd', 'JUSTDIAL', 11, 1, NOW(), NOW()),
	('Ujjivan Financial Services Ltd', 'UJJIVAN', 1, 1, NOW(), NOW()),
	('Cholamandalam Investment & Finance Company Ltd', 'CHOLAFIN', 1, 1, NOW(), NOW()),
	('Hexaware Technologies Ltd', 'HEXAWARE', 4, 1, NOW(), NOW()),
	('Escorts Ltd', 'ESCORTS', 6, 1, NOW(), NOW()),
	('Tata Elxsi Ltd', 'TATAELXSI', 4, 1, NOW(), NOW()),
	('Reliance Capital Ltd', 'RELCAPITAL', 1, 1, NOW(), NOW()),
	('GMR Infrastructure Ltd', 'GMRINFRA', 8, 1, now(), NOW()),
	('Adani Power Ltd', 'ADANIPOWER', 3, 1, now(), now()),
	('Torrent Power Ltd', 'TORNTPOWER', 3, 1, now(), now()),
	('Bata India Ltd', 'BATAINDIA', 16, 1, now(), now()),
	('BEML Ltd', 'BEML', 14, 1, now(), now()),
	('Indian Bank', 'INDIANB', 1, 1, now(), now()),
	('Jindal Steel & Power Ltd', 'JINDALSTEL', 7, 1, now(), now()),
	('PVR Ltd', 'PVR', 13, 1, now(), now()),
	('IDFC First Bank Ltd', 'IDFCFIRSTB', 1, 1, now(), now()),
	('Mahanagar Gas Ltd', 'MGL', 5, 1, now(), now()),
	('NCC Ltd', 'NCC', 8, 1, now(), now()),
	('Can Fin Homes Ltd', 'CANFINHOME', 1, 1, now(), now()),
	('Indraprastha Gas Ltd', 'IGL', 5, 1, now(), now()),
	('Balkrishna Industries Ltd', 'BALKRISIND', 14, 1, now(), now()),
	('Max Financial Services Ltd', 'MFSL', 1, 1, now(), now()),
	('Dewan Housing Finance Corporation Ltd', 'DHFL', 1, 1, now(), now()),
	('CG Power & Industrial Solutions Ltd', 'CGPOWER', 14, 1, NOW(), NOW())
;

create table trades (
	id int(11) unsigned not null AUTO_INCREMENT,
	company_id int(11) unsigned not null,
	buy_sell enum('B', 'S') not null default 'B',
	quantity mediumint(8) unsigned not null,
	buy_rate float(10, 4) unsigned not null,
	sell_date float(10, 4) unsigned default null,
	date_entered date not null,
	date_exited date default null,
	pnl float(10, 4) default null,
	primary key (id),
	index (company_id)
);

create table trade_charges (
	id int(11) unsigned not null AUTO_INCREMENT,
	charge_date date not null,
	brokerage float(10, 4) unsigned not null,
	exchange_charges float(10, 4) unsigned not null,
	clearing_charges float(10, 4) unsigned not null,
	cgst float(10, 4) unsigned not null,
	sgst float(10, 4) unsigned not null,
	igst float(10, 4) unsigned not null,
	securities_tax float(10, 4) unsigned not null,
	sebi_fees float(10, 4) unsigned not null,
	stamp_duty float(10, 4) unsigned not null,
	total_charges float(10, 4) unsigned not null,
	PRIMARY key (id)
);