import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  const UserModel({
    required this.id,
    required this.email,
    this.displayName,
    this.photoUrl,
    this.username,
    this.bio,
    this.isPremium = false,
    this.premiumExpiry,
    this.projectsCount = 0,
    this.storageUsedBytes = 0,
    this.createdAt,
    this.lastLoginAt,
    this.provider = 'email',
  });

  final String id;
  final String email;
  final String? displayName;
  final String? photoUrl;
  final String? username;
  final String? bio;
  final bool isPremium;
  final DateTime? premiumExpiry;
  final int projectsCount;
  final int storageUsedBytes;
  final DateTime? createdAt;
  final DateTime? lastLoginAt;
  final String provider;

  double get storageUsedMB => storageUsedBytes / (1024 * 1024);
  double get storageUsedGB => storageUsedBytes / (1024 * 1024 * 1024);
  double get storageLimitGB => isPremium ? 50.0 : 2.0;
  double get storagePercent => storageUsedGB / storageLimitGB;

  bool get isPremiumActive {
    if (!isPremium) return false;
    if (premiumExpiry == null) return true;
    return premiumExpiry!.isAfter(DateTime.now());
  }

  String get firstName => displayName?.split(' ').first ?? email.split('@').first;

  UserModel copyWith({
    String? displayName,
    String? photoUrl,
    String? username,
    String? bio,
    bool? isPremium,
    DateTime? premiumExpiry,
    int? projectsCount,
    int? storageUsedBytes,
    DateTime? lastLoginAt,
  }) {
    return UserModel(
      id: id,
      email: email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      username: username ?? this.username,
      bio: bio ?? this.bio,
      isPremium: isPremium ?? this.isPremium,
      premiumExpiry: premiumExpiry ?? this.premiumExpiry,
      projectsCount: projectsCount ?? this.projectsCount,
      storageUsedBytes: storageUsedBytes ?? this.storageUsedBytes,
      createdAt: createdAt,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
      provider: provider,
    );
  }

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return UserModel(
      id: doc.id,
      email: data['email'] as String? ?? '',
      displayName: data['displayName'] as String?,
      photoUrl: data['photoUrl'] as String?,
      username: data['username'] as String?,
      bio: data['bio'] as String?,
      isPremium: data['isPremium'] as bool? ?? false,
      premiumExpiry: (data['premiumExpiry'] as Timestamp?)?.toDate(),
      projectsCount: data['projectsCount'] as int? ?? 0,
      storageUsedBytes: data['storageUsedBytes'] as int? ?? 0,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
      lastLoginAt: (data['lastLoginAt'] as Timestamp?)?.toDate(),
      provider: data['provider'] as String? ?? 'email',
    );
  }

  Map<String, dynamic> toFirestore() => {
        'email': email,
        'displayName': displayName,
        'photoUrl': photoUrl,
        'username': username,
        'bio': bio,
        'isPremium': isPremium,
        'premiumExpiry':
            premiumExpiry != null ? Timestamp.fromDate(premiumExpiry!) : null,
        'projectsCount': projectsCount,
        'storageUsedBytes': storageUsedBytes,
        'createdAt': createdAt != null ? Timestamp.fromDate(createdAt!) : null,
        'lastLoginAt': FieldValue.serverTimestamp(),
        'provider': provider,
      };

  factory UserModel.fromMap(Map<String, dynamic> map) => UserModel(
        id: map['id'] as String? ?? '',
        email: map['email'] as String? ?? '',
        displayName: map['displayName'] as String?,
        photoUrl: map['photoUrl'] as String?,
        username: map['username'] as String?,
        bio: map['bio'] as String?,
        isPremium: map['isPremium'] as bool? ?? false,
        projectsCount: map['projectsCount'] as int? ?? 0,
        storageUsedBytes: map['storageUsedBytes'] as int? ?? 0,
        provider: map['provider'] as String? ?? 'email',
      );

  Map<String, dynamic> toMap() => {
        'id': id,
        'email': email,
        'displayName': displayName,
        'photoUrl': photoUrl,
        'username': username,
        'bio': bio,
        'isPremium': isPremium,
        'projectsCount': projectsCount,
        'storageUsedBytes': storageUsedBytes,
        'provider': provider,
      };
}
