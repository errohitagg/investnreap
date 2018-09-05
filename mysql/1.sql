create database `investnreap`;

use `investnreap`;

create table `indexes` (
   `id` tinyint(3) unsigned not null auto_increment,
   `name` varchar(255) not null,
   `created_at` datetime not null,
   `updated_at` datetime not null,
   primary key (`id`)
);

create table `sectors` (
    `id` tinyint(3) unsigned not null auto_increment,
    `name` varchar(255) not null,
    `created_at` datetime not null,
    `updated_at` datetime not null,
    primary key (`id`)
);

create table `companies` (
    `id` mediumint(7) unsigned not null auto_increment,
    `name` varchar(255) not null,
    `symbol` varchar(32) not null,
    `sector_id` tinyint(3) unsigned not null default 0,
    `created_at` datetime not null,
    `updated_at` datetime not null,
    primary key (`id`),
    unique (`symbol`)
);

create table `index_companies` (
    `id` int(11) unsigned not null auto_increment,
    `index_id` unsigned tinyint(3) not null,
    `company_id` unsigned mediumint(7) not null,
    `status` unsigned tinyint(3) not null default 0,
    `created_at` datetime not null,
    `updated_at` datetime not null,
    primary key (`id`)
);

create table `bhavcopy` (
    `id` int(11) unsigned not null auto_increment,
    `symbol` varchar(32) not null,
    `series` char(16) not null,
    `open` float(10, 2) not null default 0.0,
    `high` float(10, 2) not null default 0.0,
    `low` float(10, 2) not null default 0.0,
    `close` float(10, 2) not null default 0.0,
    `last` float(10, 2) not null default 0.0,
    `tottrdqty` int(11) not null default 0,
    `tottrdval` double(20, 2) not null default 0,
    `totaltrades` mediumint(7) not null default 0,
    `date` date not null,
    primary key (`id`),
    index (`date`, `symbol`)
);

insert into `indexes` (`name`, `created_at`, `updated_at`)
    values ('Nifty 50', NOW(), NOW());
    
insert into `companies` (`name`, `symbol`, `created_at`, `updated_at`)
    values ('Adani Ports and Special Economic Zone Limited', 'ADANIPORTS', NOW(), NOW()),
        ('Asian Paints Limited', 'ASIANPAINT', NOW(), NOW()),
        ('Axis Bank Limited', 'AXISBANK', NOW(), NOW()),
        ('Bajaj Auto Limited', 'BAJAJ-AUTO', NOW(), NOW()),
        ('Bajaj Finserv Limited', 'BAJAJFINSV', NOW(), NOW()),
        ('Bajaj Finance Limited', 'BAJFINANCE', NOW(), NOW()),
        ('Bharti Airtel Limited', 'BHARTIARTL', NOW(), NOW()),
        ('Bharat Petroleum Corporation Limited', 'BPCL', NOW(), NOW()),
        ('Cipla Limited', 'CIPLA', NOW(), NOW()),
        ('Coal India Limited', 'COALINDIA', NOW(), NOW()),
        ("Dr. Reddy's Laboratories Limited", 'DRREDDY', NOW(), NOW()),
        ('Eicher Motors Limited', 'EICHERMOT', NOW(), NOW()),
        ('GAIL (India) Limited', 'GAIL', NOW(), NOW()),
        ('Grasim Industries Limited', 'GRASIM', NOW(), NOW()),
        ('HCL Technologies Limited', 'HCLTECH', NOW(), NOW()),
        ('Housing Development Finance Corporation Limited', 'HDFC', NOW(), NOW()),
        ('HDFC Bank Limited', 'HDFCBANK', NOW(), NOW()),
        ('Hero MotoCorp Limited', 'HEROMOTOCO', NOW(), NOW()),
        ('Hindalco Industries Limited', 'HINDALCO', NOW(), NOW()),
        ('Hindustan Petroleum Corporation Limited', 'HINDPETRO', NOW(), NOW()),
        ('Hindustan Unilever Limited', 'HINDUNILVR', NOW(), NOW()),
        ('Indiabulls Housing Finance Limited', 'IBULHSGFIN', NOW(), NOW()),
        ('ICICI Bank Limited', 'ICICIBANK', NOW(), NOW()),
        ('IndusInd Bank Limited', 'INDUSINDBK', NOW(), NOW()),
        ('Bharti Infratel Limited', 'INFRATEL', NOW(), NOW()),
        ('Infosys Limited', 'INFY', NOW(), NOW()),
        ('Indian Oil Corporation Limited', 'IOC', NOW(), NOW()),
        ('ITC Limited', 'ITC', NOW(), NOW()),
        ('Kotak Mahindra Bank Limited', 'KOTAKBANK', NOW(), NOW()),
        ('Larsen & Toubro Limited', 'LT', NOW(), NOW()),
        ('Lupin Limited', 'LUPIN', NOW(), NOW()),
        ('Mahindra & Mahindra Limited', 'M&M', NOW(), NOW()),
        ('Maruti Suzuki India Limited', 'MARUTI', NOW(), NOW()),
        ('NTPC Limited', 'NTPC', NOW(), NOW()),
        ('Oil & Natural Gas Corporation Limited', 'ONGC', NOW(), NOW()),
        ('Power Grid Corporation of India Limited', 'POWERGRID', NOW(), NOW()),
        ('Reliance Industries Limited', 'RELIANCE', NOW(), NOW()),
        ('State Bank of India', 'SBIN', NOW(), NOW()),
        ('Sun Pharmaceutical Industries Limited', 'SUNPHARMA', NOW(), NOW()),
        ('Tata Motors Limited', 'TATAMOTORS', NOW(), NOW()),
        ('Tata Steel Limited', 'TATASTEEL', NOW(), NOW()),
        ('Tata Consultancy Services Limited', 'TCS', NOW(), NOW()),
        ('Tech Mahindra Limited', 'TECHM', NOW(), NOW()),
        ('Titan Company Limited', 'TITAN', NOW(), NOW()),
        ('UltraTech Cement Limited', 'ULTRACEMCO', NOW(), NOW()),
        ('UPL Limited', 'UPL', NOW(), NOW()),
        ('Vedanta Limited', 'VEDL', NOW(), NOW()),
        ('Wipro Limited', 'WIPRO', NOW(), NOW()),
        ('Yes Bank Limited', 'YESBANK', NOW(), NOW()),
        ('Zee Entertainment Enterprises Limited', 'ZEEL', NOW(), NOW());
    
insert into `index_companies` (`index_id`, `company_id`, `status`, `created_at`, `updated_at`)
    select i.`id`, c.`id`, 1, NOW(), NOW()
    from indexes i
        inner join companies c;
